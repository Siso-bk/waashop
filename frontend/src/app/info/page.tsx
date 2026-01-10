import { getCustomerOrders, getNotifications, getSessionUser } from "@/lib/queries";
import { InfoTabs } from "@/components/InfoTabs";
import { SiteTopNav } from "@/components/SiteTopNav";

export default async function InfoPage() {
  const user = await getSessionUser();
  const orders = user ? await getCustomerOrders() : [];
  const notifications = user ? await getNotifications() : [];

  return (
    <div className="web-shell pb-6">
      <SiteTopNav signedIn={Boolean(user)} />
      <InfoTabs user={user} initialOrders={orders} notifications={notifications} />
    </div>
  );
}
