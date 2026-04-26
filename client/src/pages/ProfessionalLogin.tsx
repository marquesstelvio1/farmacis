import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfessionalLogin() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Login do Profissional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Esta pagina foi restaurada com um componente valido para eliminar o erro de tipo no React.
          </p>
          <Link href="/profissional/dashboard">
            <Button variant="outline">Ir para dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}