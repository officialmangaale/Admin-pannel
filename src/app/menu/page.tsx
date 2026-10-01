import NotConnected from "@/components/NotConnected";

export default function MenuManagementPage() {
    return (
        <NotConnected
            title="Platform menu management is not available"
            reason="This screen edited a hardcoded list that was never saved anywhere. Menus, prices and availability are managed by each restaurant or shop in its own app; changes made there are the real ones."
            alternatives={[
                { href: "/restaurants", label: "Restaurants" },
                { href: "/grocery-shops", label: "Grocery shops" },
                { href: "/markup-rules", label: "Customer-facing price markup rules" },
            ]}
        />
    );
}
