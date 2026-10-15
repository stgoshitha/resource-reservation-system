"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw, Users } from "lucide-react";
import { GenericTable, type GenericTableColumn } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { FormSearch, FormSelect } from "@/components/ui/form";

type UserRole = "ADMIN" | "USER";
type RoleFilter = "ALL" | UserRole;
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

type User = {
  userId: string;
  fullName: string;
  email: string;
  userRole: UserRole;
  isActive: boolean;
  createdAt: string;
  reservationCount: number;
};

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type UsersResponse = {
  users?: User[];
  pagination?: PaginationData;
  message?: string;
};

const INITIAL_PAGINATION: PaginationData = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-LK", {
    timeZone: "Asia/Colombo",
    dateStyle: "medium",
  }).format(new Date(date));
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleInput, setRoleInput] = useState<RoleFilter>("ALL");
  const [statusInput, setStatusInput] = useState<StatusFilter>("ALL");
  const [role, setRole] = useState<RoleFilter>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pagination, setPagination] =
    useState<PaginationData>(INITIAL_PAGINATION);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          role,
          status,
          search,
        });

        const response = await fetch(
          `/api/admin/users?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data = (await response.json()) as UsersResponse;

        if (!response.ok) {
          throw new Error(data.message || "Failed to load users");
        }

        if (!controller.signal.aborted) {
          setUsers(data.users ?? []);
          setPagination(data.pagination ?? INITIAL_PAGINATION);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load users"
        );
        setUsers([]);
        setPagination(INITIAL_PAGINATION);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadUsers();

    return () => controller.abort();
  }, [page, role, status, search, refresh]);

  function handleSearch() {
    setPage(1);
    setSearch(searchInput.trim());
    setRole(roleInput);
    setStatus(statusInput);
  }

  const columns = useMemo<GenericTableColumn<User>[]>(
    () => [
      {
        key: "user",
        header: "User",
        render: (user) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-slate-900">
                {user.fullName}
              </p>
              <p className="break-all text-xs text-slate-500">
                {user.email}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "role",
        header: "Role",
        render: (user) => (
          <StatusBadge
            status={user.userRole === "ADMIN" ? "Admin" : "User"}
            variant={user.userRole === "ADMIN" ? "info" : "neutral"}
            size="sm"
          />
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (user) => (
          <StatusBadge
            status={user.isActive ? "Active" : "Inactive"}
            variant={user.isActive ? "success" : "danger"}
            size="sm"
          />
        ),
      },
      {
        key: "reservations",
        header: "Reservations",
        accessor: "reservationCount",
      },
      {
        key: "joinedDate",
        header: "Joined Date",
        render: (user) => formatDate(user.createdAt),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        render: (user) => (
          <button
            type="button"
            onClick={() => setSelectedUser(user)}
            aria-label={`View ${user.fullName}`}
            title="View user"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-indigo-600 transition hover:bg-indigo-50"
          >
            <Eye size={18} />
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-7">
      <PageHeader
        title="User Management"
        description="View registered users, account roles, and reservation activity."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Users" },
        ]}
        actions={
          <button
            type="button"
            onClick={() => setRefresh((value) => value + 1)}
            disabled={loading}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        }
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSearch();
        }}
        className="flex flex-col gap-4 lg:flex-row lg:items-center"
      >
        <div className="min-w-0 flex-1">
          <FormSearch
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search user name or email..."
            aria-label="Search users"
          />
        </div>

        <div className="w-full lg:w-64">
          <FormSelect
            value={roleInput}
            onChange={(event) =>
              setRoleInput(event.target.value as RoleFilter)
            }
            aria-label="Filter by role"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="USER">User</option>
          </FormSelect>
        </div>

        <div className="w-full lg:w-56">
          <FormSelect
            value={statusInput}
            onChange={(event) =>
              setStatusInput(event.target.value as StatusFilter)
            }
            aria-label="Filter by status"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </FormSelect>
        </div>

        <button
          type="submit"
          className="h-11 rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          Search
        </button>
      </form>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <GenericTable<User>
        data={users}
        columns={columns}
        getRowKey={(user) => user.userId}
        loading={loading}
        emptyMessage={
          error ? "Unable to display users." : "No users found."
        }
        searchable={false}
        pagination={false}
      />

      <div className="rounded-2xl border border-slate-200 bg-white px-5 pb-4 shadow-sm">
        <Pagination
          currentPage={pagination.page}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={setPage}
          showPageSize={false}
          showInfo
          disabled={loading}
        />
      </div>

      <Modal
        open={selectedUser !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
        title="User Details"
        description="Registered account information"
        size="md"
        footer={
          <button
            type="button"
            onClick={() => setSelectedUser(null)}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Close
          </button>
        }
      >
        {selectedUser && (
          <dl className="divide-y divide-slate-100">
            {[
              ["Full Name", selectedUser.fullName],
              ["Email", selectedUser.email],
              ["Role", selectedUser.userRole],
              [
                "Status",
                selectedUser.isActive ? "Active" : "Inactive",
              ],
              [
                "Total Reservations",
                String(selectedUser.reservationCount),
              ],
              ["Joined Date", formatDate(selectedUser.createdAt)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm"
              >
                <dt className="text-slate-500">{label}</dt>
                <dd className="break-all text-right font-medium text-slate-900">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>
    </div>
  );
}
