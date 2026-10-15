"use client";

import { useMyReservations } from "./my-reservations/useMyReservations";
import MyReservationsView from "./my-reservations/MyReservationsView";

export default function MyReservationsPage() {
  const model = useMyReservations();
  return <MyReservationsView model={model} />;
}
