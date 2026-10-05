import ApiStatus from "@/components/ApiStatus";
import CreatePartyForm from "@/components/CreatePartyForm";

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Order together, without the chaos.
      </h1>
      <p className="max-w-xl text-lg text-stone-600">
        Create a dining party, share the menu with your group, and get one clear
        order for the restaurant.
      </p>
      <CreatePartyForm />
      <ApiStatus />
    </div>
  );
}
