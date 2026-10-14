import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  oauth: "Impossibile completare l'accesso con Google. Riprova.",
  otp: "Il link utilizzato non è più valido. Richiedine uno nuovo.",
  missing_code: "Accesso non completato. Riprova dalla schermata di login.",
  missing_params: "Link non valido o scaduto.",
};

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  const message =
    (params?.code && ERROR_MESSAGES[params.code]) ??
    "Si è verificato un errore. Riprova più tardi.";

  return <p className="text-sm text-muted-foreground">{message}</p>;
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="border-0 bg-white/90 shadow-soft">
            <CardHeader>
              <CardTitle className="text-2xl text-solar-text">
                Qualcosa è andato storto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense>
                <ErrorContent searchParams={searchParams} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
