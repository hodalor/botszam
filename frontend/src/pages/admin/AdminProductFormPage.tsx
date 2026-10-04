import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useAdminCategories,
  useAdminProduct,
  useCreateProduct,
  useUpdateProduct,
  useUploadColourImages,
  useUploadProductImages,
} from '@/api/admin'
import type { AdminProductInput } from '@/api/types'
import { api, errorMessage } from '@/api/client'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Alert, Button, Input, Select, Skeleton, Textarea } from '@/components/ui'
import { applyServerFieldErrors } from '@/lib/forms'
import { kwachaToNgwee, ngweeToKwacha } from '@/lib/money'
import { PageMeta } from '@/components/seo/PageMeta'

function suggestSku(name: string, size: string, colour: string) {
  const part = (s: string) =>
    s
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 20)
  return [part(name) || 'ITEM', part(size) || 'SZ', part(colour) || 'COL'].join('-')
}

const variantSchema = z.object({
  size: z.string().trim().min(1, 'Size required').max(60),
  colour: z.string().trim().min(1, 'Colour required').max(60),
  colourHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use #RRGGBB').or(z.literal('')),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, 'SKU required')
    .max(64)
    .regex(/^[A-Z0-9-]+$/, 'Letters, numbers and dashes only'),
  priceKwacha: z.coerce.number().min(0.01, 'Enter a price'),
  compareAtKwacha: z.union([z.literal(''), z.coerce.number().min(0)]).optional(),
  stock: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0),
  active: z.boolean(),
  skuManual: z.boolean().optional(),
})

const formSchema = z.object({
  name: z.string().trim().min(2, 'Name required').max(160),
  slug: z.string().trim().max(200).optional(),
  description: z.string().trim().max(5000),
  careInstructions: z.string().trim().max(2000),
  category: z.string().trim().min(2, 'Choose a category'),
  featured: z.boolean(),
  active: z.boolean(),
  variants: z.array(variantSchema).min(1, 'Add at least one variant'),
})

type FormInput = z.input<typeof formSchema>
type FormValues = z.output<typeof formSchema>

interface ImageRow {
  url: string
  publicId: string | null
  preview?: string
  file?: File
}

const emptyVariant = (name = ''): FormInput['variants'][number] => ({
  size: '',
  colour: '',
  colourHex: '#E05A78',
  sku: suggestSku(name, '', ''),
  priceKwacha: 0,
  compareAtKwacha: '',
  stock: 0,
  lowStockThreshold: 5,
  active: true,
  skuManual: false,
})

export function AdminProductFormPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const { data: existing, isPending: loadingExisting } = useAdminProduct(isNew ? undefined : id)
  const { data: categories = [] } = useAdminCategories()
  const create = useCreateProduct()
  const update = useUpdateProduct(id ?? '')
  const upload = useUploadProductImages(id ?? '')
  const uploadColour = useUploadColourImages(id ?? '')
  const [images, setImages] = useState<ImageRow[]>([])
  /** Photos keyed by colour name (shared across sizes of that colour). */
  const [colourImages, setColourImages] = useState<Record<string, ImageRow[]>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const submittingRef = useRef(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const colourFileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const defaults = useMemo<FormInput>(
    () => ({
      name: '',
      slug: '',
      description: '',
      careInstructions: '',
      category: categories[0]?.slug ?? '',
      featured: false,
      active: true,
      variants: [emptyVariant()],
    }),
    [categories],
  )

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'variants' })
  const name = watch('name')
  const watchedVariants = watch('variants')

  const colourNames = useMemo(() => {
    const seen = new Set<string>()
    const list: string[] = []
    for (const v of watchedVariants ?? []) {
      const colour = v.colour?.trim()
      if (!colour) continue
      const key = colour.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      list.push(colour)
    }
    return list
  }, [watchedVariants])

  useEffect(() => {
    if (!existing) return
    reset({
      name: existing.name,
      slug: existing.slug,
      description: existing.description,
      careInstructions: existing.careInstructions ?? '',
      category: existing.category,
      featured: existing.featured,
      active: existing.active,
      variants: existing.variants.map((v) => ({
        size: v.size,
        colour: v.colour,
        colourHex: v.colourHex || '#E05A78',
        sku: v.sku,
        priceKwacha: ngweeToKwacha(v.priceNgwee),
        compareAtKwacha: v.compareAtPriceNgwee != null ? ngweeToKwacha(v.compareAtPriceNgwee) : '',
        stock: v.stock,
        lowStockThreshold: v.lowStockThreshold,
        active: v.active,
        skuManual: true,
      })),
    })
    setImages(existing.images.map((img) => ({ url: img.url, publicId: img.publicId })))
    const byColour: Record<string, ImageRow[]> = {}
    for (const v of existing.variants) {
      const colour = v.colour.trim()
      if (!colour || byColour[colour]) continue
      byColour[colour] = (v.images ?? []).map((img) => ({ url: img.url, publicId: img.publicId }))
    }
    setColourImages(byColour)
  }, [existing, reset])

  useEffect(() => {
    if (!isNew || existing || !categories[0]?.slug) return
    setValue('category', categories[0].slug)
  }, [isNew, existing, categories, setValue])

  const moveImage = (index: number, dir: -1 | 1) => {
    setImages((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const onFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return
    const rows: ImageRow[] = [...fileList].map((file) => ({
      url: '',
      publicId: null,
      preview: URL.createObjectURL(file),
      file,
    }))
    setImages((prev) => [...prev, ...rows].slice(0, 12))
  }

  const onColourFiles = (colour: string, fileList: FileList | null) => {
    if (!fileList?.length || !colour.trim()) return
    const rows: ImageRow[] = [...fileList].map((file) => ({
      url: '',
      publicId: null,
      preview: URL.createObjectURL(file),
      file,
    }))
    setColourImages((prev) => ({
      ...prev,
      [colour]: [...(prev[colour] ?? []), ...rows].slice(0, 12),
    }))
  }

  const moveColourImage = (colour: string, index: number, dir: -1 | 1) => {
    setColourImages((prev) => {
      const list = [...(prev[colour] ?? [])]
      const target = index + dir
      if (target < 0 || target >= list.length) return prev
      ;[list[index], list[target]] = [list[target], list[index]]
      return { ...prev, [colour]: list }
    })
  }

  const imagesForColour = (colour: string) => {
    const exact = colourImages[colour]
    if (exact) return exact
    const hit = Object.entries(colourImages).find(([k]) => k.toLowerCase() === colour.toLowerCase())
    return hit?.[1] ?? []
  }

  const toPayload = (values: FormValues): AdminProductInput => ({
    name: values.name,
    slug: values.slug?.trim() || undefined,
    description: values.description,
    careInstructions: values.careInstructions,
    category: values.category,
    featured: values.featured,
    active: values.active,
    images: images
      .filter((img) => img.url)
      .map((img) => ({ url: img.url, publicId: img.publicId })),
    variants: values.variants.map((v) => {
      const compare =
        v.compareAtKwacha === '' || v.compareAtKwacha === undefined
          ? null
          : kwachaToNgwee(Number(v.compareAtKwacha))
      const colourGallery = imagesForColour(v.colour.trim())
        .filter((img) => img.url)
        .map((img) => ({ url: img.url, publicId: img.publicId }))
      return {
        sku: v.sku,
        size: v.size,
        colour: v.colour,
        colourHex: v.colourHex || undefined,
        images: colourGallery,
        priceNgwee: kwachaToNgwee(v.priceKwacha),
        compareAtPriceNgwee: compare,
        stock: v.stock,
        lowStockThreshold: v.lowStockThreshold,
        active: v.active,
      }
    }),
  })

  const uploadPendingColourImages = async (productId: string) => {
    for (const colour of colourNames) {
      const pending = imagesForColour(colour).filter((img) => img.file)
      if (!pending.length) continue
      const form = new FormData()
      form.append('colour', colour)
      for (const img of pending) if (img.file) form.append('images', img.file)
      await api.post(`/admin/products/${productId}/colour-images`, form, { timeout: 120_000 })
    }
  }

  const onSubmit = async (values: FormValues) => {
    if (submittingRef.current) return
    submittingRef.current = true
    setFormError(null)
    try {
      const payload = toPayload(values)
      let productId = id
      if (isNew) {
        const created = await create.mutateAsync(payload)
        productId = created._id
        const pending = images.filter((img) => img.file)
        if (pending.length) {
          const form = new FormData()
          for (const img of pending) if (img.file) form.append('images', img.file)
          await api.post(`/admin/products/${productId}/images`, form, { timeout: 120_000 })
        }
        await uploadPendingColourImages(productId!)
        toast.success('Product created')
        navigate(`/admin/products/${productId}`, { replace: true })
      } else {
        await update.mutateAsync(payload)
        const pending = images.filter((img) => img.file)
        if (pending.length) {
          await upload.mutateAsync(pending.map((p) => p.file!).filter(Boolean))
        }
        for (const colour of colourNames) {
          const colourPending = imagesForColour(colour).filter((img) => img.file)
          if (colourPending.length) {
            await uploadColour.mutateAsync({
              colour,
              files: colourPending.map((p) => p.file!).filter(Boolean),
            })
          }
        }
        toast.success('Product saved')
        navigate('/admin/products')
      }
    } catch (error) {
      if (
        !applyServerFieldErrors(error, setError, {
          name: 'name',
          slug: 'slug',
          description: 'description',
          careInstructions: 'careInstructions',
          category: 'category',
          variants: 'variants',
        })
      ) {
        setFormError(errorMessage(error))
      }
    } finally {
      submittingRef.current = false
    }
  }

  if (!isNew && loadingExisting) {
    return (
      <div className="space-y-4 px-4 py-8 md:px-10">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <>
      <PageMeta title={isNew ? 'New product · Admin' : 'Edit product · Admin'} noIndex />
      <AdminPageHeader
        title={isNew ? 'New product' : existing?.name || 'Edit product'}
        backTo="/admin/products"
        backLabel="Products"
      />

      <form
        noValidate
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        className="space-y-8 px-4 pb-16 sm:px-6 md:px-10"
      >
        <section className="grid gap-4 rounded-md border border-sand bg-cream p-4 sm:grid-cols-2 sm:p-5">
          <Input label="Name" required error={errors.name?.message} {...register('name')} className="sm:col-span-2" />
          <Input label="Slug" optional hint="Leave blank to auto-generate" error={errors.slug?.message} {...register('slug')} />
          <Select
            label="Category"
            required
            error={errors.category?.message}
            options={categories.map((c) => ({ value: c.slug, label: c.name }))}
            {...register('category')}
          />
          <Textarea label="Description" rows={4} className="sm:col-span-2" {...register('description')} />
          <Textarea label="Care instructions" optional rows={3} className="sm:col-span-2" {...register('careInstructions')} />
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('active')} /> Active
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('featured')} /> Featured
          </label>
        </section>

        <section className="rounded-md border border-sand bg-cream p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg">Gallery images</h2>
              <p className="mt-1 text-sm text-stone">Default photos when a colour has none of its own.</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              Upload
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                onFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>
          {images.length === 0 ? (
            <p className="mt-3 text-sm text-stone">No images yet. Upload after filling details — or when editing.</p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((img, index) => (
                <li key={`${img.url || img.preview}-${index}`} className="overflow-hidden rounded-md border border-sand">
                  <img
                    src={img.preview || img.url}
                    alt=""
                    className="aspect-[4/3] w-full object-cover bg-linen"
                  />
                  <div className="flex items-center justify-between gap-1 p-2">
                    <div className="flex gap-1">
                      <button type="button" className="rounded-md p-2 hover:bg-sand/60" aria-label="Move up" onClick={() => moveImage(index, -1)}>
                        <ArrowUp className="size-4" />
                      </button>
                      <button type="button" className="rounded-md p-2 hover:bg-sand/60" aria-label="Move down" onClick={() => moveImage(index, 1)}>
                        <ArrowDown className="size-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="rounded-md p-2 text-danger hover:bg-danger-soft"
                      aria-label="Remove image"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-md border border-sand bg-cream p-4 sm:p-5">
          <h2 className="text-lg">Colour photos</h2>
          <p className="mt-1 text-sm text-stone">
            Upload photos for each colour. Shoppers see these when they tap that swatch.
          </p>
          {colourNames.length === 0 ? (
            <p className="mt-3 text-sm text-stone">Add colour names on variants below first.</p>
          ) : (
            <ul className="mt-4 space-y-5">
              {colourNames.map((colour) => {
                const list = imagesForColour(colour)
                const hex =
                  watchedVariants?.find((v) => v.colour.trim().toLowerCase() === colour.toLowerCase())
                    ?.colourHex || '#E05A78'
                return (
                  <li key={colour} className="rounded-md border border-sand bg-linen/40 p-3 sm:p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-6 rounded-full ring-1 ring-charcoal/15"
                          style={{ backgroundColor: hex }}
                          aria-hidden="true"
                        />
                        <p className="font-medium">{colour}</p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => colourFileRefs.current[colour]?.click()}
                      >
                        Upload
                      </Button>
                      <input
                        ref={(el) => {
                          colourFileRefs.current[colour] = el
                        }}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          onColourFiles(colour, e.target.files)
                          e.target.value = ''
                        }}
                      />
                    </div>
                    {list.length === 0 ? (
                      <p className="text-sm text-stone">No photos for this colour yet.</p>
                    ) : (
                      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {list.map((img, index) => (
                          <li
                            key={`${colour}-${img.url || img.preview}-${index}`}
                            className="overflow-hidden rounded-md border border-sand bg-cream"
                          >
                            <img
                              src={img.preview || img.url}
                              alt=""
                              className="aspect-[4/3] w-full object-cover bg-linen"
                            />
                            <div className="flex items-center justify-between gap-1 p-2">
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  className="rounded-md p-2 hover:bg-sand/60"
                                  aria-label="Move up"
                                  onClick={() => moveColourImage(colour, index, -1)}
                                >
                                  <ArrowUp className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  className="rounded-md p-2 hover:bg-sand/60"
                                  aria-label="Move down"
                                  onClick={() => moveColourImage(colour, index, 1)}
                                >
                                  <ArrowDown className="size-4" />
                                </button>
                              </div>
                              <button
                                type="button"
                                className="rounded-md p-2 text-danger hover:bg-danger-soft"
                                aria-label="Remove image"
                                onClick={() =>
                                  setColourImages((prev) => ({
                                    ...prev,
                                    [colour]: (prev[colour] ?? list).filter((_, i) => i !== index),
                                  }))
                                }
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="rounded-md border border-sand bg-cream p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg">Variants</h2>
            <Button type="button" variant="secondary" size="sm" onClick={() => append(emptyVariant(name))}>
              <Plus className="size-4" />
              Add
            </Button>
          </div>
          {errors.variants?.root && (
            <p className="mt-2 text-xs text-danger" role="alert">
              {errors.variants.root.message}
            </p>
          )}
          <div className="mt-4 space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-md border border-sand bg-linen/50 p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">Variant {index + 1}</p>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      className="text-sm text-danger"
                      onClick={() => remove(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Input
                    label="Size"
                    required
                    error={errors.variants?.[index]?.size?.message}
                    {...register(`variants.${index}.size`, {
                      onChange: (e) => {
                        const colour = watch(`variants.${index}.colour`)
                        if (!watch(`variants.${index}.skuManual`)) {
                          setValue(`variants.${index}.sku`, suggestSku(name, e.target.value, colour))
                        }
                      },
                    })}
                  />
                  <Input
                    label="Colour name"
                    required
                    error={errors.variants?.[index]?.colour?.message}
                    {...register(`variants.${index}.colour`, {
                      onChange: (e) => {
                        const size = watch(`variants.${index}.size`)
                        if (!watch(`variants.${index}.skuManual`)) {
                          setValue(`variants.${index}.sku`, suggestSku(name, size, e.target.value))
                        }
                      },
                    })}
                  />
                  <div className="flex gap-2">
                    <Input
                      label="Colour"
                      type="color"
                      className="w-20"
                      value={
                        /^#[0-9A-Fa-f]{6}$/.test(watch(`variants.${index}.colourHex`) || '')
                          ? watch(`variants.${index}.colourHex`)
                          : '#E05A78'
                      }
                      onChange={(e) => setValue(`variants.${index}.colourHex`, e.target.value, { shouldDirty: true })}
                    />
                    <Input
                      label="Hex"
                      error={errors.variants?.[index]?.colourHex?.message}
                      {...register(`variants.${index}.colourHex`)}
                      className="flex-1"
                    />
                  </div>
                  <Input
                    label="SKU"
                    required
                    error={errors.variants?.[index]?.sku?.message}
                    {...register(`variants.${index}.sku`, {
                      onChange: () => setValue(`variants.${index}.skuManual`, true),
                    })}
                  />
                  <Input
                    label="Price (K)"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    error={errors.variants?.[index]?.priceKwacha?.message}
                    {...register(`variants.${index}.priceKwacha`)}
                  />
                  <Input
                    label="Compare-at (K)"
                    type="number"
                    step="0.01"
                    min="0"
                    optional
                    {...register(`variants.${index}.compareAtKwacha`)}
                  />
                  <Input
                    label="Stock"
                    type="number"
                    min="0"
                    required
                    error={errors.variants?.[index]?.stock?.message}
                    {...register(`variants.${index}.stock`)}
                  />
                  <Input
                    label="Low-stock at"
                    type="number"
                    min="0"
                    {...register(`variants.${index}.lowStockThreshold`)}
                  />
                  <label className="inline-flex items-center gap-2 self-end pb-2 text-sm">
                    <input type="checkbox" {...register(`variants.${index}.active`)} /> Active
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>

        {formError && <Alert tone="danger">{formError}</Alert>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => navigate('/admin/products')}>
            Cancel
          </Button>
          <Button type="submit" size="lg" loading={isSubmitting} loadingText="Saving…">
            {isNew ? 'Create product' : 'Save changes'}
          </Button>
        </div>
      </form>
    </>
  )
}
