import { useMemo, useState, useEffect, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Upload, FileDown, Settings, FileText } from 'lucide-react'
import { AdminPanel } from '@/components/AdminPanel'
import { ROBOTO_BOLD, ROBOTO_REGULAR } from '@/lib/fonts'
import type { AppData } from '@/types/electron'

// --- Data model
const DATA = {
  DIRECT: {
    label: 'KOSZTY BEZPOŚREDNIE',
    groups: {
      WYNAGRODZENIA: [
        { id: '1.1', label: 'WYNAGRODZENIA ETATOWE' },
        { id: '1.2', label: 'WYNAGRODZENIA DODATKOWE' },
        { id: '1.3', label: 'STYPENDIA' }
      ],
      APARATURA: [{ id: '2', label: 'APARATURA' }],
      INNE: [
        { id: '3.1', label: 'LAPTOPY DLA ZESPOŁU' },
        { id: '3.2', label: 'Moviesens Software' },
        { id: '3.3', label: 'PAVLOVIA PLATFORM LICENCE' },
        { id: '3.4', label: 'FIRMA REKRUTACYJNA (USŁUGI OBCE)' },
        { id: '3.5', label: 'DYSK ZEWNĘTRZNY' },
        { id: '3.6', label: 'KONFERENCJE' },
        { id: '3.7', label: 'PROGRAMING EXP. (USŁUGI OBCE)' },
        { id: '3.8', label: 'WYKONAWCY ZBIOROWI' },
        { id: '3.9', label: 'MATERIAŁY BIUROWE' }
      ]
    }
  },
  INDIRECT: {
    label: 'KOSZTY POŚREDNIE',
    groups: {
      PODSTAWOWE: [
        { id: 'P1', label: 'Koszty OA' },
        { id: 'P2', label: 'Koszty 15% kierownika' },
        { id: 'P3', label: 'Koszty pośrednie IP' }
      ]
    }
  }
} as const

type DirectGroupKey = string

type Categories = AppData['categories']

const FALLBACK_INDIRECT_GROUP = 'PODSTAWOWE'

const cloneDefaultCategories = (): Categories => JSON.parse(JSON.stringify(DATA)) as Categories

const normalizeCategories = (raw: unknown): Categories => {
  const cloned = JSON.parse(JSON.stringify(raw ?? DATA)) as Categories & {
    INDIRECT: { items?: Array<{ id: string; label: string }> }
  }

  if (!cloned.DIRECT || typeof cloned.DIRECT !== 'object') {
    cloned.DIRECT = cloneDefaultCategories().DIRECT
  }

  if (!cloned.DIRECT.groups) {
    cloned.DIRECT.groups = cloneDefaultCategories().DIRECT.groups
  }

  const indirect = cloned.INDIRECT as Categories['INDIRECT'] & {
    items?: Array<{ id: string; label: string }>
  }

  if (!indirect || typeof indirect !== 'object') {
    const fallback = cloneDefaultCategories().INDIRECT
    cloned.INDIRECT = fallback
    return cloned
  }

  if (!indirect.groups) {
    const legacyItems = Array.isArray(indirect.items) ? indirect.items : []
    indirect.groups = { [FALLBACK_INDIRECT_GROUP]: legacyItems }
  }

  Object.keys(indirect.groups).forEach((key) => {
    if (!Array.isArray(indirect.groups[key])) {
      indirect.groups[key] = []
    }
  })

  delete (indirect as { items?: unknown }).items

  return cloned
}

// --- Validation
const FormSchema = z.object({
  projectName: z.string().min(1, 'Wpisz nazwę projektu'),
  agreementNumber: z.string().min(1, 'Wpisz numer umowy'),
  costType: z.enum(['DIRECT', 'INDIRECT'], {
    message: 'Wybierz rodzaj kosztu'
  }),
  directGroup: z.string().optional(), // Only for DIRECT
  indirectGroup: z.string().optional(), // Only for INDIRECT
  costCategory: z.string().min(1, 'Wybierz kategorię'),
  notes: z.string().optional(),
  invoicePdf: z.any().optional() // File
})

export type FormValues = z.infer<typeof FormSchema>

export default function MinimalCostForm() {
  const [invoiceName, setInvoiceName] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'form' | 'admin'>('form')
  const [data, setData] = useState<Categories>(() => normalizeCategories(DATA))
  const [isLoading, setIsLoading] = useState(true)

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      projectName: '',
      agreementNumber: '',
      costType: undefined as unknown as 'DIRECT' | 'INDIRECT',
      directGroup: undefined,
      indirectGroup: undefined,
      costCategory: '',
      notes: ''
    },
    mode: 'onChange'
  })

  // Ładowanie danych przy starcie
  useEffect(() => {
    const loadData = async () => {
      try {
        if (window.electronAPI) {
          const loaded = await window.electronAPI.loadData()
          if (loaded) {
            setData(normalizeCategories(loaded.categories))
            if (loaded.lastProjectName) {
              form.setValue('projectName', loaded.lastProjectName)
            }
            if (loaded.lastAgreementNumber) {
              form.setValue('agreementNumber', loaded.lastAgreementNumber)
            }
          }
        }
      } catch (error) {
        console.error('Błąd ładowania danych:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Zapisywanie danych
  const saveDataToElectron = useCallback(async () => {
    try {
      if (window.electronAPI) {
        const appData: AppData = {
          categories: data,
          lastProjectName: form.getValues('projectName'),
          lastAgreementNumber: form.getValues('agreementNumber')
        }
        await window.electronAPI.saveData(appData)
      }
    } catch (error) {
      console.error('Błąd zapisu danych:', error)
    }
  }, [data, form])

  // Automatyczne zapisywanie przy zmianie danych
  useEffect(() => {
    if (!isLoading) {
      saveDataToElectron()
    }
  }, [data, isLoading, saveDataToElectron])

  // Funkcja do resolvowania labela kategorii
  const resolveCategoryLabel = useCallback(
    (values: FormValues) => {
      if (values.costType === 'DIRECT') {
        const groupKey = values.directGroup as DirectGroupKey | undefined
        if (!groupKey) return '-'
        const list = data.DIRECT.groups[groupKey] || []
        const found = list.find((i: { id: string; label: string }) => i.id === values.costCategory)
        return found ? found.label : '-'
      }

      const groupKey = values.indirectGroup as string | undefined
      if (!groupKey) return '-'
      const list = data.INDIRECT.groups[groupKey] || []
      const found = list.find((i: { id: string; label: string }) => i.id === values.costCategory)
      return found ? found.label : '-'
    },
    [data]
  )

  // PDF generation
  const generatePdf = useCallback(
    async (values: FormValues) => {
      const { default: jsPDF } = await import('jspdf')

      const doc = new jsPDF()
      // Embed Roboto so generated PDFs keep Polish characters intact
      doc.addFileToVFS('Roboto-Regular.ttf', ROBOTO_REGULAR)
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
      doc.addFileToVFS('Roboto-Bold.ttf', ROBOTO_BOLD)
      doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')
      doc.setFont('Roboto', 'normal')
      const line = (y: number) => doc.line(14, y, 196, y)

      doc.setFontSize(16)
      doc.setFont('Roboto', 'bold')
      doc.text('Podsumowanie kosztu', 14, 18)
      doc.setFont('Roboto', 'normal')

      doc.setFontSize(11)
      let y = 30

      // Wyciągnij nazwę grupy
      const groupName =
        values.costType === 'DIRECT' ? values.directGroup || '-' : values.indirectGroup || '-'

      const rows: Array<[string, string]> = [
        ['NUMER UMOWY PROJEKTU', values.agreementNumber],
        ['NAZWA PROJEKTU', values.projectName],
        ['GRUPA KOSZTU', groupName],
        ['KATEGORIA KOSZTU', resolveCategoryLabel(values)]
      ]

      rows.forEach(([k, v]) => {
        doc.setFont('Roboto', 'bold')
        doc.text(`${k}:`, 14, y)
        doc.setFont('Roboto', 'normal')
        doc.text(v || '-', 80, y)
        y += 10
        line(y - 6)
      })

      if (values.notes) {
        y += 6
        doc.setFont('Roboto', 'bold')
        doc.text('NOTATKI:', 14, y)
        doc.setFont('Roboto', 'normal')
        const split = doc.splitTextToSize(values.notes, 170)
        y += 8
        doc.text(split, 14, y)
      }

      if (values.invoicePdf) {
        try {
          const { PDFDocument } = await import('pdf-lib')

          const summaryPdfBytes = doc.output('arraybuffer')
          const invoiceArrayBuffer = await values.invoicePdf.arrayBuffer()

          const summaryPdfDoc = await PDFDocument.load(summaryPdfBytes)
          const invoicePdfDoc = await PDFDocument.load(invoiceArrayBuffer)

          const mergedPdf = await PDFDocument.create()

          const summaryPages = await mergedPdf.copyPages(
            summaryPdfDoc,
            summaryPdfDoc.getPageIndices()
          )
          summaryPages.forEach((page) => mergedPdf.addPage(page))

          const invoicePages = await mergedPdf.copyPages(
            invoicePdfDoc,
            invoicePdfDoc.getPageIndices()
          )
          invoicePages.forEach((page) => mergedPdf.addPage(page))

          const mergedPdfBytes = await mergedPdf.save()

          const blob = new Blob([mergedPdfBytes as BlobPart], {
            type: 'application/pdf'
          })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `koszt-${values.agreementNumber || 'dane'}-z-faktura.pdf`
          link.click()
          URL.revokeObjectURL(url)
        } catch (error) {
          console.error('Error merging PDFs:', error)
          doc.save(`koszt-${values.agreementNumber || 'dane'}.pdf`)
        }
      } else {
        doc.save(`koszt-${values.agreementNumber || 'dane'}.pdf`)
      }
    },
    [data, resolveCategoryLabel]
  )

  const costType = form.watch('costType')
  const directGroup = form.watch('directGroup') as DirectGroupKey | undefined
  const indirectGroup = form.watch('indirectGroup') as string | undefined

  const directGroupOptions = useMemo(
    () => Object.keys(data.DIRECT.groups) as DirectGroupKey[],
    [data]
  )

  const directCategoryOptions = useMemo(() => {
    if (!directGroup) return [] as { id: string; label: string }[]
    return data.DIRECT.groups[directGroup] || []
  }, [directGroup, data])

  const indirectGroupOptions = useMemo(() => Object.keys(data.INDIRECT.groups), [data])

  const indirectCategoryOptions = useMemo(() => {
    if (!indirectGroup) return [] as { id: string; label: string }[]
    return data.INDIRECT.groups[indirectGroup] || []
  }, [indirectGroup, data])

  const onSubmit = async (values: FormValues) => {
    await generatePdf(values)

    // Reset formularza, zachowując nazwę projektu i numer umowy
    const projectName = values.projectName
    const agreementNumber = values.agreementNumber

    // Pełny reset formularza
    form.reset()

    // Przywróć tylko nazwę projektu i numer umowy
    form.setValue('projectName', projectName)
    form.setValue('agreementNumber', agreementNumber)

    setInvoiceName('')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-gray-900 py-8 px-4 transition-colors duration-500">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Formularz kosztu projektu
          </h1>
          {/* <p className="text-gray-600 text-sm">Wypełnij formularz i wygeneruj podsumowanie PDF</p> */}
        </div>

        {/* Zakładki */}
        <div className="mb-6 flex gap-2 justify-center animate-in fade-in slide-in-from-top-4 duration-500">
          <Button
            variant={activeTab === 'form' ? 'default' : 'outline'}
            onClick={() => setActiveTab('form')}
            className={`transition-all duration-300 ${
              activeTab === 'form'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                : 'hover:bg-blue-50'
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Formularz
          </Button>
          <Button
            variant={activeTab === 'admin' ? 'default' : 'outline'}
            onClick={() => setActiveTab('admin')}
            className={`transition-all duration-300 ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                : 'hover:bg-blue-50'
            }`}
          >
            <Settings className="w-4 h-4 mr-2" />
            Panel Admina
          </Button>
        </div>

        {/* Zawartość formularza */}
        {activeTab === 'form' && (
          <>
            <Card className="border border-gray-200/50 shadow-xl shadow-blue-100/50 backdrop-blur-sm bg-white/80 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-200/50 animate-in fade-in slide-in-from-bottom-4">
              <CardContent className="p-8">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Project info */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-6 rounded-xl border border-blue-100 transition-all duration-300 hover:border-blue-200">
                      <h3 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                        Podstawowe informacje
                      </h3>
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2 animate-in fade-in duration-500">
                          <Label
                            htmlFor="projectName"
                            className="text-sm font-medium text-gray-700"
                          >
                            Nazwa projektu
                          </Label>
                          <Input
                            id="projectName"
                            placeholder="np. Projekt Alfa"
                            className="transition-all duration-200 focus:scale-[1.02]"
                            {...form.register('projectName')}
                          />
                          {form.formState.errors.projectName && (
                            <p className="mt-1.5 text-xs text-red-600 animate-in fade-in slide-in-from-top-1 duration-300">
                              {form.formState.errors.projectName.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2 animate-in fade-in duration-500 delay-75">
                          <Label
                            htmlFor="agreementNumber"
                            className="text-sm font-medium text-gray-700"
                          >
                            Numer umowy
                          </Label>
                          <Input
                            id="agreementNumber"
                            placeholder="np. UMO/123/2025"
                            className="transition-all duration-200 focus:scale-[1.02]"
                            {...form.register('agreementNumber')}
                          />
                          {form.formState.errors.agreementNumber && (
                            <p className="mt-1.5 text-xs text-red-600 animate-in fade-in slide-in-from-top-1 duration-300">
                              {form.formState.errors.agreementNumber.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Invoice upload */}
                      <div className="space-y-3 mt-6">
                        <Label htmlFor="invoice" className="text-sm font-medium text-gray-700">
                          Faktura (PDF)
                        </Label>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <input
                            id="invoice"
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              form.setValue('invoicePdf', file)
                              setInvoiceName(file ? file.name : '')
                            }}
                          />
                          <Label
                            htmlFor="invoice"
                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-3 text-sm font-medium transition-all duration-300 hover:border-blue-400 hover:bg-blue-50 hover:scale-105 active:scale-95"
                          >
                            <Upload className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-[-2px]" />
                            Wybierz plik PDF
                          </Label>
                          {invoiceName && (
                            <span className="text-sm text-gray-700 font-medium bg-green-50 px-4 py-2 rounded-lg border border-green-200 animate-in fade-in slide-in-from-left duration-300 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                              {invoiceName}
                            </span>
                          )}
                          {!invoiceName && (
                            <span className="text-sm text-gray-500 italic">
                              Brak wybranego pliku
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Wybrany plik zostanie dołączony do wygenerowanego PDF-a podsumowania
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-8" />

                  {/* Cost type */}
                  <div className="space-y-4">
                    <Label className="text-sm font-semibold text-gray-800">Rodzaj kosztu</Label>
                    <Controller
                      control={form.control}
                      name="costType"
                      render={({ field }) => (
                        <RadioGroup
                          onValueChange={(v) => {
                            field.onChange(v)
                            // reset dependent fields
                            form.setValue('directGroup', undefined)
                            form.setValue('indirectGroup', undefined)
                            form.setValue('costCategory', '')
                          }}
                          value={field.value}
                          className="grid grid-cols-1 gap-4 md:grid-cols-2"
                        >
                          <Label htmlFor="direct" className="relative group block cursor-pointer">
                            <div
                              className={`flex items-center space-x-3 rounded-xl border-2 p-4 transition-all duration-300 ${
                                field.value === 'DIRECT'
                                  ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                              }`}
                            >
                              <RadioGroupItem
                                value="DIRECT"
                                id="direct"
                                className="transition-transform duration-200 group-hover:scale-110"
                              />
                              <span className="font-medium text-sm flex-1">
                                {data.DIRECT.label}
                              </span>
                            </div>
                          </Label>
                          <Label htmlFor="indirect" className="relative group block cursor-pointer">
                            <div
                              className={`flex items-center space-x-3 rounded-xl border-2 p-4 transition-all duration-300 ${
                                field.value === 'INDIRECT'
                                  ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
                                  : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30'
                              }`}
                            >
                              <RadioGroupItem
                                value="INDIRECT"
                                id="indirect"
                                className="transition-transform duration-200 group-hover:scale-110"
                              />
                              <span className="font-medium text-sm flex-1">
                                {data.INDIRECT.label}
                              </span>
                            </div>
                          </Label>
                        </RadioGroup>
                      )}
                    />
                    {form.formState.errors.costType && (
                      <p className="mt-2 text-xs text-red-600 animate-in fade-in slide-in-from-top-1 duration-300">
                        {form.formState.errors.costType.message}
                      </p>
                    )}
                  </div>

                  {/* Category pickers */}
                  {costType === 'DIRECT' && (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Grupa kategorii</Label>
                        <Controller
                          control={form.control}
                          name="directGroup"
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={(v) => {
                                field.onChange(v)
                                form.setValue('costCategory', '')
                              }}
                            >
                              <SelectTrigger className="transition-all duration-200 hover:border-blue-400 focus:scale-[1.01]">
                                <SelectValue placeholder="Wybierz grupę..." />
                              </SelectTrigger>
                              <SelectContent>
                                {directGroupOptions.map((g) => (
                                  <SelectItem
                                    key={g}
                                    value={g}
                                    className="cursor-pointer transition-colors duration-150"
                                  >
                                    {g}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Kategoria kosztu
                        </Label>
                        <Controller
                          control={form.control}
                          name="costCategory"
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={!directGroup}
                            >
                              <SelectTrigger
                                className={`transition-all duration-200 ${
                                  directGroup
                                    ? 'hover:border-blue-400 focus:scale-[1.01]'
                                    : 'opacity-60'
                                }`}
                              >
                                <SelectValue
                                  placeholder={
                                    directGroup ? 'Wybierz kategorię...' : 'Najpierw wybierz grupę'
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {directCategoryOptions.map((opt: { id: string; label: string }) => (
                                  <SelectItem
                                    key={opt.id}
                                    value={opt.id}
                                    className="cursor-pointer transition-colors duration-150"
                                  >
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {form.formState.errors.costCategory && (
                          <p className="mt-1.5 text-xs text-red-600 animate-in fade-in slide-in-from-top-1 duration-300">
                            {form.formState.errors.costCategory.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {costType === 'INDIRECT' && (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Grupa kategorii</Label>
                        <Controller
                          control={form.control}
                          name="indirectGroup"
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={(v) => {
                                field.onChange(v)
                                form.setValue('costCategory', '')
                              }}
                            >
                              <SelectTrigger className="transition-all duration-200 hover:border-indigo-400 focus:scale-[1.01]">
                                <SelectValue placeholder="Wybierz grupę..." />
                              </SelectTrigger>
                              <SelectContent>
                                {indirectGroupOptions.map((g) => (
                                  <SelectItem
                                    key={g}
                                    value={g}
                                    className="cursor-pointer transition-colors duration-150"
                                  >
                                    {g}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Kategoria kosztu
                        </Label>
                        <Controller
                          control={form.control}
                          name="costCategory"
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={!indirectGroup}
                            >
                              <SelectTrigger
                                className={`transition-all duration-200 ${
                                  indirectGroup
                                    ? 'hover:border-indigo-400 focus:scale-[1.01]'
                                    : 'opacity-60'
                                }`}
                              >
                                <SelectValue
                                  placeholder={
                                    indirectGroup
                                      ? 'Wybierz kategorię...'
                                      : 'Najpierw wybierz grupę'
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {indirectCategoryOptions.map(
                                  (opt: { id: string; label: string }) => (
                                    <SelectItem
                                      key={opt.id}
                                      value={opt.id}
                                      className="cursor-pointer transition-colors duration-150"
                                    >
                                      {opt.label}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {form.formState.errors.costCategory && (
                          <p className="mt-1.5 text-xs text-red-600 animate-in fade-in slide-in-from-top-1 duration-300">
                            {form.formState.errors.costCategory.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                      Notatki (opcjonalnie)
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Dodatkowe informacje, uwagi, szczegóły..."
                      className="h-28 resize-none transition-all duration-200 focus:scale-[1.01] hover:border-gray-400"
                      {...form.register('notes')}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        form.reset()
                        setInvoiceName('')
                      }}
                      className="transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      Wyczyść formularz
                    </Button>
                    <Button
                      type="submit"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                    >
                      <FileDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-[2px]" />
                      Generuj PDF
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </>
        )}

        {/* Panel Admina */}
        {activeTab === 'admin' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AdminPanel
              data={{ categories: data }}
              onDataChange={(newData) => setData(newData.categories)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
