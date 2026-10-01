import NotConnected from "@/components/NotConnected";

export default function SettingsPage() {
    return (
        <NotConnected
            title="Admin settings are not available"
            reason="The profile, password, two-factor and session controls on this screen were never connected to the backend, so none of them did anything. They have been switched off so nobody assumes an account setting was changed."
            alternatives={[
                { href: "/admin-roles", label: "Admin roles and permissions" },
                { href: "/history", label: "Audit trail of admin actions" },
            ]}
        />
    );
}
