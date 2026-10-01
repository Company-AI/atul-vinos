import { redirect } from "next/navigation";

/*
  Las bodegas pasaron a ser una solapa de Clasificación, junto al resto de las
  listas del catálogo. La dirección vieja sigue viva porque está en enlaces
  guardados y en el historial de quienes la usaban todos los días.
*/
export default function AdminWineriesPage() {
  redirect("/admin/clasificacion?tipo=bodegas");
}
