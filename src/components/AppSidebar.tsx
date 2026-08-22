
import { Home, Settings, Database, FileText, Users, Monitor, GraduationCap, Award, Truck, Calendar, ClipboardList, UserCheck, BarChart3, ChevronRight, type LucideIcon } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useIsMobile } from "@/hooks/use-mobile"
import { useState } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

interface MenuItem {
  title: string
  url: string
  icon: LucideIcon
}

interface MenuGroup {
  label: string
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    label: "Dashboard",
    items: [
      { title: "Dashboard", url: "/", icon: Home }
    ]
  },
  {
    label: "Data Management",
    items: [
      { title: "Data PKL", url: "/data-pkl", icon: FileText },
      { title: "Browse Siswa", url: "/browse-siswa", icon: Users }
    ]
  },
  {
    label: "Akademik",
    items: [
      { title: "Nilai Siswa", url: "/nilai-siswa", icon: GraduationCap },
      { title: "Cetak Sertifikat", url: "/cetak-sertifikat", icon: Award }
    ]
  },
  {
    label: "Proses PKL",
    items: [
      { title: "Pengantaran", url: "/pengantaran", icon: Truck },
      { title: "Presensi", url: "/presensi", icon: Calendar },
      { title: "Penilaian", url: "/penilaian", icon: ClipboardList },
      { title: "Pembimbingan", url: "/pembimbingan", icon: UserCheck },
      { title: "Monitoring", url: "/monitoring", icon: Monitor }
    ]
  },
  {
    label: "Laporan",
    items: [
      { title: "Rekap PKL", url: "/laporan-rekap-pkl", icon: BarChart3 },
      { title: "Rekap Siswa", url: "/laporan-rekap-siswa", icon: BarChart3 },
      { title: "By Kategori", url: "/rekap-by-kategori", icon: BarChart3 },
      { title: "Lap. Monitoring", url: "/laporan-monitoring", icon: BarChart3 },
      { title: "Lap. Pelanggaran", url: "/laporan-pelanggaran", icon: BarChart3 }
    ]
  },
  {
    label: "Sistem",
    items: [
      { title: "Konfigurasi", url: "/konfigurasi", icon: Database },
      { title: "Settings", url: "/settings", icon: Settings }
    ]
  }
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"
  const isMobile = useIsMobile()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-primary font-semibold shadow-sm" : "hover:bg-sidebar-accent/50 text-sidebar-foreground"

  const toggleGroup = (groupLabel: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupLabel]: !prev[groupLabel]
    }))
  }

  const hasActiveItem = (items: MenuItem[]) => {
    return items.some(item => isActive(item.url))
  }

  return (
    <Sidebar
      className={`bg-gradient-sidebar border-r border-sidebar-border transition-all duration-300`}
      collapsible={isMobile ? "offcanvas" : "icon"}
    >
      <SidebarContent className="pt-6">
        <div className="px-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            {(!collapsed || isMobile) && (
              <div>
                <h2 className="text-base sm:text-lg font-bold text-sidebar-foreground">SMK KRIAN 1</h2>
                <p className="text-xs sm:text-sm text-sidebar-foreground/70">Sistem Informasi PKL</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 px-3">
          {menuGroups.map((group) => {
            const isGroupOpen = openGroups[group.label] !== false // Default to open
            const groupHasActive = hasActiveItem(group.items)
            
            // For single-item groups (like Dashboard), render directly
            if (group.items.length === 1) {
              const item = group.items[0]
              return (
                <div key={group.label}>
                  <SidebarMenuButton asChild className="rounded-lg transition-all duration-200">
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => `flex items-center gap-3 px-3 py-2 sm:py-2.5 rounded-lg ${getNavCls({ isActive })}`}
                    >
                      <item.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      {(!collapsed || isMobile) && <span className="font-medium text-sm sm:text-base">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </div>
              )
            }

            // For multi-item groups, render as collapsible group
            return (
              <SidebarGroup key={group.label}>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => toggleGroup(group.label)}
                    className={`rounded-lg transition-all duration-200 ${groupHasActive ? 'bg-sidebar-accent/50' : 'hover:bg-sidebar-accent/50'}`}
                  >
                    <div className="flex items-center gap-3 px-3 py-2 sm:py-2.5 w-full">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      {(!collapsed || isMobile) && (
                        <>
                          <span className="font-medium text-sm sm:text-base flex-1">{group.label}</span>
                          <ChevronRight className={`h-4 w-4 transition-transform ${isGroupOpen ? 'rotate-90' : ''}`} />
                        </>
                      )}
                    </div>
                  </SidebarMenuButton>
                  
                  {isGroupOpen && (!collapsed || isMobile) && (
                    <SidebarMenuSub className="ml-4 mt-1 space-y-1">
                      {group.items.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild className="rounded-lg transition-all duration-200">
                            <NavLink 
                              to={item.url} 
                              end 
                              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg ${getNavCls({ isActive })}`}
                            >
                              <item.icon className="h-4 w-4 flex-shrink-0" />
                              <span className="font-medium text-sm">{item.title}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              </SidebarGroup>
            )
          })}
        </div>

        {(!collapsed || isMobile) && (
          <div className="mt-auto p-4">
            <div className="bg-sidebar-accent/30 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-sidebar-foreground">Achyar Nur Sahid</p>
                  <p className="text-xs text-sidebar-foreground/70">Admin</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  )
}