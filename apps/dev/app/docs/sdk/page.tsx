import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, P, Pre, Anchor } from '../../_components/Prose';

export const metadata: Metadata = {
  title: 'SDK',
  description: 'Adapter pattern for every major agent framework via subpath exports.',
};

export default function SdkPage() {
  return (
    <Prose>
      <H1>SDK adapters</H1>
      <Lead>Adapter pattern for every major agent framework via subpath exports.</Lead>

      <P>
        <code className="font-mono text-primary">@mosadd/ai</code> ships adapters for every major agent framework — as{' '}
        <strong>subpath exports</strong>, not separate packages (Stripe Agent Toolkit pattern).
      </P>

      <H2>Vercel AI SDK</H2>
      <Pre lang="ts">{`import { mosadd } from '@mosadd/ai/vercel';

const tools = mosadd({
  modules: ['mDM', 'mROOM'],
});

await streamText({ model, tools });`}</Pre>

      <H2>LangChain</H2>
      <Pre lang="ts">{`import { mosadd } from '@mosadd/ai/langchain';

const tools = mosadd({ modules: ['mDM', 'mTALK'] });
const agent = createReactAgent({ llm, tools });`}</Pre>

      <H2>OpenAI Agents SDK</H2>
      <Pre lang="ts">{`import { mosadd } from '@mosadd/ai/openai';

const agent = new Agent({
  tools: mosadd({ modules: ['mp0st', 'mTALK'] }),
});`}</Pre>

      <H2>Anthropic Agents</H2>
      <Pre lang="ts">{`import { mosadd } from '@mosadd/ai/anthropic';

const tools = mosadd({ modules: ['mDM', 'mROOM', 'mRAG'] });`}</Pre>

      <H2>Bring your own framework</H2>
      <P>
        The <code className="font-mono text-primary">mosadd()</code> function returns a plain{' '}
        <code className="font-mono">&#123; name, description, schema, execute &#125;</code> tool list.
        Adapt to any custom framework with one wrapper.
      </P>
      <P>
        See <Anchor href="https://github.com/Hei33enberg/mosadd-os/tree/main/packages/ai"><code className="font-mono text-primary">packages/ai</code></Anchor> on GitHub.
      </P>
    </Prose>
  );
}
