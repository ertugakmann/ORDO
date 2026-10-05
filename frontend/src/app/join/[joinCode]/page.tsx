import JoinView from "@/components/JoinView";

export default async function JoinPage({
  params,
}: PageProps<"/join/[joinCode]">) {
  const { joinCode } = await params;
  return <JoinView joinCode={joinCode} />;
}
