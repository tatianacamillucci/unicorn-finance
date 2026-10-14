import { Panel } from "@/components/ui/panel";

export function DbNonPronto() {
  return (
    <Panel title="Il database non è ancora pronto">
      <p className="text-sm text-muted-foreground">
        Mancano ancora alcune tabelle nel database. Appena sono pronte, qui vedrai i tuoi dati.
      </p>
    </Panel>
  );
}
