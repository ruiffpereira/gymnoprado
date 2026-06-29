import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useCms } from "../context/CmsContext";
import { useScreenHeader } from "../store/useHeader";

/**
 * Ecrã "Política de Privacidade" (/privacidade) — RGPD.
 *
 * Conteúdo editável no CMS (contexto gym), multilíngua:
 *  - `gym.app.privacy.title`   → título;
 *  - `gym.app.privacy.content` → corpo HTML (override do ginásio); se vazio,
 *    mostramos um texto-base RGPD em PT (para nunca ficar vazio nem o link do
 *    banner de cookies ficar partido).
 * Acessível com e sem sessão (o banner de cookies aparece antes do login).
 */
export function Privacy() {
  const { t } = useCms();
  const navigate = useNavigate();
  useScreenHeader({ title: t("gym.app.privacy.title") || "Privacidade" });

  const negocio = t("gym.app.business.name") || "o ginásio";
  const updated = t("gym.app.privacy.updated") || "junho de 2026";
  const custom = t("gym.app.privacy.content");

  return (
    <div className="px-5 lg:px-9 py-6 max-w-3xl mx-auto animate-fadeIn">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-t3 hover:text-t1 mb-4"
      >
        <ChevronLeft size={16} /> {t("gym.app.common.back") || "Voltar"}
      </button>

      <h1 className="text-2xl font-black text-t1 tracking-tight mb-1">
        {t("gym.app.privacy.title") || "Política de Privacidade"}
      </h1>
      <p className="text-[13px] text-t3 mb-7">
        {t("gym.app.privacy.updated_label") || "Última atualização"}: {updated}
      </p>

      {custom ? (
        <div
          className="space-y-3 text-[15px] leading-relaxed text-t2 [&_h2]:text-t1 [&_h2]:font-bold [&_h2]:text-base [&_h2]:mt-6 [&_h2]:mb-1.5 [&_a]:text-brand [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
          dangerouslySetInnerHTML={{ __html: custom }}
        />
      ) : (
        <DefaultPolicy negocio={negocio} />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-base font-bold text-t1 mb-1.5">{title}</h2>
      <div className="text-[15px] leading-relaxed text-t2 space-y-2">{children}</div>
    </section>
  );
}

function DefaultPolicy({ negocio }: { negocio: string }) {
  return (
    <div>
      <p className="text-[15px] leading-relaxed text-t2 mb-6">
        A sua privacidade é importante para {negocio}. Esta política explica que
        dados pessoais tratamos quando usa esta aplicação, para que os usamos e
        quais os seus direitos ao abrigo do Regulamento Geral sobre a Proteção de
        Dados (RGPD).
      </p>

      <Section title="1. Responsável pelo tratamento">
        <p>
          {negocio} é o responsável pelo tratamento dos seus dados. Para questões
          de privacidade, contacte-nos pelos contactos do ginásio.
        </p>
      </Section>

      <Section title="2. Que dados tratamos">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <b>Conta:</b> nome, email, telemóvel e palavra-passe (guardada de
            forma cifrada).
          </li>
          <li>
            <b>Treino:</b> programas, treinos realizados, séries, cargas e
            progresso que regista na app.
          </li>
          <li>
            <b>Mensalidade:</b> estado de pagamento da sua mensalidade (gerido
            pelo ginásio).
          </li>
          <li>
            <b>Estatísticas de utilização:</b> dados agregados e anónimos (ver
            secção Cookies).
          </li>
        </ul>
      </Section>

      <Section title="3. Para que usamos os dados">
        <ul className="list-disc pl-5 space-y-1">
          <li>Gerir o seu programa de treino e registar o seu progresso;</li>
          <li>Gerir a sua conta e mensalidade;</li>
          <li>Enviar notificações e lembretes (se os ativar);</li>
          <li>Melhorar a app através de estatísticas agregadas.</li>
        </ul>
      </Section>

      <Section title="4. Base legal">
        <p>
          Tratamos os seus dados para a <b>execução do contrato</b> (a sua
          inscrição/mensalidade), com base no seu <b>consentimento</b> (cookies
          não essenciais e notificações) e no nosso <b>interesse legítimo</b> em
          manter o serviço seguro e funcional.
        </p>
      </Section>

      <Section title="5. Cookies e estatísticas">
        <p>
          Usamos apenas cookies <b>essenciais</b>. Para estatísticas usamos uma
          ferramenta <b>sem cookies e anónima</b> (Plausible, auto-hospedado),
          que <b>não</b> rastreia entre sites nem cria perfis individuais.
        </p>
      </Section>

      <Section title="6. Treinos no calendário">
        <p>
          Se subscrever os treinos no calendário do telemóvel, geramos um link
          privado (.ics) com o seu programa ativo. O link é pessoal — não o
          partilhe. Pode deixar de o usar removendo a subscrição no calendário.
        </p>
      </Section>

      <Section title="7. Conservação dos dados">
        <p>
          Conservamos os seus dados enquanto a sua conta/inscrição existir ou
          enquanto forem necessários para as finalidades acima.
        </p>
      </Section>

      <Section title="8. Os seus direitos">
        <p>
          Tem direito a aceder, retificar, eliminar e exportar (portabilidade) os
          seus dados, bem como a opor-se ou limitar o seu tratamento. Para os
          exercer, contacte o ginásio. Tem ainda o direito de reclamar junto da
          Comissão Nacional de Proteção de Dados (CNPD).
        </p>
      </Section>

      <Section title="9. Subcontratantes">
        <p>
          Recorremos a fornecedores que tratam dados em nosso nome (alojamento e
          envio de emails), sujeitos a confidencialidade e segurança. Os dados
          não são vendidos a terceiros.
        </p>
      </Section>

      <Section title="10. Alterações a esta política">
        <p>
          Podemos atualizar esta política. A data da última atualização está no
          topo desta página.
        </p>
      </Section>
    </div>
  );
}
