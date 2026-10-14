import Link from "next/link";

import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  FolderTree,
  Package,
  Users,
} from "lucide-react";

import { prisma } from "@/src/lib/prisma";

import StatCard from "@/components/ui/stat-card/StatCard";

import RecentReservationsTable from
  "@/components/admin/dashboard/RecentReservationsTable";

export default async function AdminDashboardPage() {
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

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Dashboard Overview
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Monitor resources, reservations, and users
          across ReserveHub.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Resources"
          value={totalResources}
          icon={<Package size={22} />}
          description="Registered resources"
          variant="primary"
        />

        <StatCard
          title="Total Categories"
          value={totalCategories}
          icon={<FolderTree size={22} />}
          description="Resource categories"
          variant="neutral"
        />

        <StatCard
          title="Total Reservations"
          value={totalReservations}
          icon={<CalendarDays size={22} />}
          description="All reservation records"
          variant="primary"
        />

        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={<Users size={22} />}
          description="Registered users"
          variant="neutral"
        />

        <StatCard
          title="Available Resources"
          value={availableResources}
          icon={<CheckCircle2 size={22} />}
          description="Resources available for booking"
          variant="success"
        />

        <StatCard
          title="Confirmed Reservations"
          value={confirmedReservations}
          icon={<CalendarCheck size={22} />}
          description="Confirmed reservation records"
          variant="success"
        />
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
            className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
          >
            View All
          </Link>
        </div>

        <RecentReservationsTable
          reservations={formattedReservations}
        />
      </section>
    </div>
  );
}