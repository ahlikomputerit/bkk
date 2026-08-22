import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Settings, Database, Activity, CalendarDays } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { loadStoredWordTemplates } from "@/lib/templateStorage"
import { getErrorMessage } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface RecentPlacement {
  id: string
  created_at: string
  students?: { nama?: string } | null
  companies?: { nama?: string } | null
  pkl_periods?: { nama?: string; start_date?: string; end_date?: string } | null
}

interface DashboardData {
  totalStudents: number
  activePlacements: number
  templateCount: number
  companyCount: number
  wallpaperCount: number
  activePeriod: string
  recentPlacements: RecentPlacement[]
}

const emptyDashboardData: DashboardData = {
  totalStudents: 0,
  activePlacements: 0,
  templateCount: 0,
  companyCount: 0,
  wallpaperCount: 0,
  activePeriod: "Belum ada periode aktif",
  recentPlacements: [],
}

function formatDate(value?: string): string {
  if (!value) return "-"

  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

function formatPeriod(placement: RecentPlacement): string {
  const period = placement.pkl_periods
  if (!period) return "Periode belum ditentukan"

  const dates = [formatDate(period.start_date), formatDate(period.end_date)]
  return `${period.nama || "Periode PKL"} • ${dates.join(" - ")}`
}

function readWallpaperCount(): number {
  try {
    const savedImages = localStorage.getItem("headerImages")
    const images: unknown = savedImages ? JSON.parse(savedImages) : []
    return Array.isArray(images) ? images.length : 0
  } catch {
    return 0
  }
}

const Dashboard = () => {
  const [data, setData] = useState<DashboardData>(emptyDashboardData)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true

    const loadDashboard = async () => {
      setLoading(true)
      try {
        const [studentsResponse, placementsResponse, companiesResponse, recentResponse, activePeriodResponse] = await Promise.all([
          supabase.from("students").select("id", { count: "exact", head: true }),
          supabase.from("pkl_placements").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
          supabase.from("companies").select("id", { count: "exact", head: true }),
          supabase
            .from("pkl_placements")
            .select("id, created_at, students(nama), companies(nama), pkl_periods(nama, start_date, end_date)")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("pkl_periods")
            .select("nama")
            .eq("is_active", true)
            .order("start_date", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ])

        const firstError = [
          studentsResponse.error,
          placementsResponse.error,
          companiesResponse.error,
          recentResponse.error,
          activePeriodResponse.error,
        ].find(Boolean)
        if (firstError) throw firstError

        if (!mounted) return

        setData({
          totalStudents: studentsResponse.count || 0,
          activePlacements: placementsResponse.count || 0,
          templateCount: loadStoredWordTemplates().length,
          companyCount: companiesResponse.count || 0,
          wallpaperCount: readWallpaperCount(),
          activePeriod: activePeriodResponse.data?.nama || "Belum ada periode aktif",
          recentPlacements: (recentResponse.data || []) as RecentPlacement[],
        })
      } catch (error: unknown) {
        console.error("Error loading dashboard:", error)
        if (mounted) {
          toast({
            title: "Dashboard tidak dapat diperbarui",
            description: getErrorMessage(error, "Periksa koneksi ke database lalu coba lagi."),
            variant: "destructive",
          })
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadDashboard()
    return () => {
      mounted = false
    }
  }, [toast])

  const stats = useMemo(() => [
    {
      title: "Total Siswa",
      value: data.totalStudents,
      description: "Siswa terdaftar",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Penempatan Aktif",
      value: data.activePlacements,
      description: "Siswa sedang PKL",
      icon: Activity,
      color: "text-green-600",
    },
    {
      title: "Template Word",
      value: data.templateCount,
      description: "Template tersedia",
      icon: FileText,
      color: "text-purple-600",
    },
    {
      title: "Perusahaan Mitra",
      value: data.companyCount,
      description: "Mitra terdaftar",
      icon: Database,
      color: "text-orange-600",
    },
  ], [data])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang di Sistem Informasi PKL SMK Krian 1</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-soft bg-gradient-to-br from-card to-card/80 hover:shadow-elegant transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{loading ? "..." : stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Penempatan Terbaru
            </CardTitle>
            <CardDescription>Data penempatan PKL yang terakhir ditambahkan</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Memuat data terbaru...</p>
            ) : data.recentPlacements.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data penempatan PKL.</p>
            ) : (
              <div className="space-y-4">
                {data.recentPlacements.map((placement) => (
                  <div key={placement.id} className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{placement.students?.nama || "Siswa belum ditentukan"}</p>
                      <p className="text-sm text-muted-foreground truncate">{placement.companies?.nama || "Perusahaan belum ditentukan"}</p>
                    </div>
                    <p className="text-right text-xs text-muted-foreground whitespace-nowrap">{formatPeriod(placement)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Statistik Sistem
            </CardTitle>
            <CardDescription>Ringkasan konfigurasi aplikasi saat ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><FileText className="h-4 w-4" />Template Word</span>
                <span className="font-medium">{loading ? "..." : `${data.templateCount} template`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><Database className="h-4 w-4" />Wallpaper</span>
                <span className="font-medium">{loading ? "..." : `${data.wallpaperCount} wallpaper`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" />Periode Aktif</span>
                <span className="max-w-[60%] text-right font-medium truncate">{loading ? "..." : data.activePeriod}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
