import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  FolderTree,
  Package,
  Plus,
  Users,
} from "lucide-react";
import { prisma } from "@/src/lib/prisma";
import StatCard from "@/components/ui/stat-card/StatCard";
import RecentReservationsTable from "@/components/admin/dashboard/RecentReservationsTable";
async function DashboardContent() {
  // Load dashboard statistics and the five most recent reservations.
  const [
    totalResources,
    totalCategories,
    totalReservations,
    totalUsers,
    availableResources,
    confirmedReservations,
    recentReservations,
  ] = await Promise.all([
    prisma.resource.count(),
    prisma.resourceCategory.count(),
    prisma.reservation.count(),
    prisma.user.count(),
    prisma.resource.count({
      where: {
        resourceStatus: "AVAILABLE",
      },
    }),
    prisma.reservation.count({
      where: {
        reservationStatus: "CONFIRMED",
      },
    }),
    prisma.reservation.findMany({
      take: 5,
      orderBy: [
        { createdAt: "desc" },
        { reservationId: "desc" },
      ],
      select: {
        reservationId: true,
        reservationTitle: true,
        reservationStatus: true,
        startTime: true,
        resource: {
          select: {
            resourceName: true,
          },
        },
        user: {
          select: {
            fullName: true,
          },
        },
      },
    }),
  ]);
  // Prepare reservation dates and related names for the table.
  const formattedReservations = recentReservations.map(
    (reservation) => ({
      reservationId: reservation.reservationId,
      reservationTitle: reservation.reservationTitle,
      reservationStatus: reservation.reservationStatus,
      startTime: reservation.startTime.toISOString(),
      resourceName: reservation.resource.resourceName,
      userName: reservation.user.fullName,
    })
  );
  const availabilityPercent = totalResources > 0
    ? Math.round((availableResources / totalResources) * 100)
    : 0;
  return (
    <>
      <style>{`
        @keyframes dashboard-reveal {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: no-preference) {
          .dashboard-reveal { animation: dashboard-reveal 450ms ease-out both; }
          .dashboard-delay-1 { animation-delay: 70ms; }
          .dashboard-delay-2 { animation-delay: 140ms; }
          .dashboard-delay-3 { animation-delay: 210ms; }
        }
      `}</style>
    <div className="w-full min-w-0 space-y-5 pb-8 sm:space-y-6 lg:space-y-7 2xl:space-y-8">
      {/* Page heading */}
      <div className="dashboard-reveal flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl 2xl:text-4xl">
            Operations Overview
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Monitor resources, reservations, and users
            across ReserveHub.
          </p>
        </div>
        <Link
          href="/admin/resources"
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 self-start whitespace-nowrap rounded-xl sm:w-auto md:shrink-0 bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md active:translate-y-0 motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <Plus size={17} />
          Manage Resources
        </Link>
      </div>
      {/* Statistics */}
      <section
        aria-label="System statistics"
        className="dashboard-reveal dashboard-delay-1 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 2xl:gap-5"
      >
        <StatCard
          title="Total Resources"
          value={totalResources}
          icon={<Package size={21} />}
          description="Registered resources"
          variant="primary"
        />
        <StatCard
          title="Total Categories"
          value={totalCategories}
          icon={<FolderTree size={21} />}
          description="Resource categories"
          variant="neutral"
        />
        <StatCard
          title="Total Reservations"
          value={totalReservations}
          icon={<CalendarDays size={21} />}
          description="All reservation records"
          variant="primary"
        />
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={<Users size={21} />}
          description="Registered users"
          variant="neutral"
        />
        <StatCard
          title="Available Resources"
          value={availableResources}
          icon={<CheckCircle2 size={21} />}
          description="Resources available for booking"
          variant="success"
        />
        <StatCard
          title="Confirmed Reservations"
          value={confirmedReservations}
          icon={<CalendarCheck size={21} />}
          description="Confirmed reservation records"
          variant="success"
        />
      </section>
      {/* Operational overview */}
      <section className="dashboard-reveal dashboard-delay-2 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3 2xl:gap-5">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-indigo-100 hover:shadow-md sm:p-5 lg:p-6 xl:col-span-2 2xl:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Reservation Overview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                A snapshot of reservation records.
              </p>
            </div>
            <Link
              href="/admin/reservations"
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 transition-colors duration-200 hover:text-indigo-800"
            >
              View reservations
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 2xl:mt-6">
            <div className="min-w-0 rounded-xl bg-indigo-50 p-4 transition-colors duration-200 hover:bg-indigo-100/70 sm:p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-indigo-700">
                <CalendarDays size={18} />
                All reservations
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight text-indigo-950">
                {totalReservations}
              </p>
            </div>
            <div className="min-w-0 rounded-xl bg-emerald-50 p-4 transition-colors duration-200 hover:bg-emerald-100/70 sm:p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <CalendarCheck size={18} />
                Confirmed
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight text-emerald-950">
                {confirmedReservations}
              </p>
            </div>
          </div>
        </div>
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-indigo-100 hover:shadow-md sm:p-5 lg:p-6 2xl:p-7">
          <h2 className="text-lg font-semibold text-slate-900">
            Resource Availability
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Resources currently marked available.
          </p>
          <div className="mt-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-bold tracking-tight text-slate-900">
                  {availableResources}
                  <span className="ml-1 text-base font-medium text-slate-400">
                    / {totalResources}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Available resources
                </p>
              </div>
              <span className="text-sm font-semibold text-emerald-600">
                {availabilityPercent}
                %
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Available resource percentage"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={availabilityPercent}
              className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100"
            >
              <div
                className="h-full rounded-full bg-emerald-500 transition-[width] duration-700 ease-out motion-reduce:transition-none"
                style={{
                  width: `${availabilityPercent}%`,
                }}
              />
            </div>
          </div>
          <Link
            href="/admin/resources"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition-colors duration-200 hover:text-indigo-800"
          >
            Manage resources
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      {/* Recent reservations */}
      <section className="dashboard-reveal dashboard-delay-3 min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
        <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Reservations
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              The latest five reservations in the system.
            </p>
          </div>
          <Link
            href="/admin/reservations"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 transition-colors duration-200 hover:text-indigo-800"
          >
            View all reservations
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
          <RecentReservationsTable
            reservations={formattedReservations}
          />
        </div>
      </section>
    </div>
    </>
  );
}

// Stream dashboard data while showing a lightweight loading state.
export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div role="status" aria-live="polite" className="space-y-5 pb-8 sm:space-y-6">
          <div className="h-8 w-64 max-w-full animate-pulse rounded-lg bg-slate-200 motion-reduce:animate-none" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none" />
          <span className="sr-only">Loading admin dashboard...</span>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
