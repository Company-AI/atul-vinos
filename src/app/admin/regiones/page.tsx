import { redirect } from "next/navigation";

/* Ver la nota en /admin/bodegas. */
export default function AdminRegionsPage() {
  redirect("/admin/clasificacion?tipo=regiones");
}
