import { Panel } from "@/components/ui/panel";

export function DbNonPronto() {
  return (
    <Panel title="Il database non è ancora pronto">
      <p className="text-sm text-muted-foreground">
        Mancano ancora delle tabelle. Quando sono pronte, questa pagina funzionerà da sola.
      </p>
    </Panel>
  );
}
