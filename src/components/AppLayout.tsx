import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 glass"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[240px]">
            <AppSidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main content */}
      <main className="lg:pl-[240px] min-h-screen">
        <div className="p-6 lg:p-10">
          {/* Page header */}
          {title && (
            <div className="mb-8 text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">{title}</h1>
              {subtitle && (
                <p className="text-sm sm:text-base text-muted-foreground mt-2">{subtitle}</p>
              )}
            </div>
          )}

          {/* Page content */}
          {children}
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
