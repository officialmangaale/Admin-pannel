import NotConnected from "@/components/NotConnected";

export default function CalendarPage() {
    return (
        <NotConnected
            title="Calendar is not available"
            reason="This screen only ever showed sample data from July 2025 and was never connected to the backend, so it has been switched off rather than show invented orders and riders."
            alternatives={[
                { href: "/orders", label: "Orders (live, filterable by date)" },
                { href: "/riders", label: "Riders" },
            ]}
        />
    );
}
