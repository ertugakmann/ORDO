import PartyLeaderView from "@/components/PartyLeaderView";

export default async function PartyPage({
  params,
}: PageProps<"/party/[joinCode]">) {
  const { joinCode } = await params;
  return <PartyLeaderView joinCode={joinCode} />;
}
