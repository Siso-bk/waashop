import { getCustomerOrders, getNotifications, getSessionUser } from "@/lib/queries";
import { InfoTabs } from "@/components/InfoTabs";

export default async function InfoPage() {
  const user = await getSessionUser();
  const orders = user ? await getCustomerOrders() : [];
  const notifications = user ? await getNotifications() : [];

  return <InfoTabs user={user} initialOrders={orders} notifications={notifications} />;
}
