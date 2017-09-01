# @motorcycle/react-dom -- 0.0.0

React integration for Motorcycle.ts

## Get it
```sh
yarn add @motorcycle/react-dom
# or
npm install --save @motorcycle/react-dom
```

## API Documentation

All functions are curried!

#### isolate\<Sources extends { readonly dom: DomSource }, Sinks extends { readonly view$: Stream\<VNode\> }\>(component: Component\<Sources, Sinks\>, key: string): Component\<Sources, Sinks\>

<p>

Isolates a component by adding an isolation class name to the outermost
DOM element emitted by the component’s view stream.

The isolation class name is generated by appending the given isolation `key`
to the prefix `$$isolation$$-`, e.g., given `foo` as `key` produces
`$$isolation$$-foo`.

Isolating components are useful especially when dealing with lists of a
specific component, so that events can be differentiated between the siblings.
However, isolated components are not isolated from access by an ancestor DOM
element.

</p>


<details>
  <summary>See an example</summary>
  
```typescript
const MyIsolatedComponent = isolate(MyComponent, `myIsolationKey`)
const sinks = MyIsolatedComponent(sources)
```

</details>

<details>
<summary>See the code</summary>

```typescript

export function isolate<Sources extends DomSources, Sinks extends DomSinks>(
  component: Component<Sources, Sinks>,
  key: string
): Component<Sources, Sinks> {
  return function isolatedComponent(sources: Sources) {
    const { dom } = sources
    const isolatedDom = dom.query(`.${KEY_PREFIX}${key}`)
    const sinks = component(Object.assign({}, sources, { dom: isolatedDom }))
    const isolatedSinks = Object.assign({}, sinks, { view$: isolateView(sinks.view$, key) })

    return isolatedSinks
  }
}

const KEY_PREFIX = `__isolation__`

function isolateView(view$: Stream<VNode>, key: string) {
  const prefixedKey = KEY_PREFIX + key

  return map(
    updateClassName((className: string = EMPTY_CLASS_NAME) => {
      const needsIsolation = !contains(prefixedKey, className)

      return needsIsolation
        ? removeSuperfluousSpaces(join(CLASS_NAME_SEPARATOR, [className, prefixedKey]))
        : className
    }),
    view$
  )
}

const EMPTY_CLASS_NAME = ``
const CLASS_NAME_SEPARATOR = ` `

function removeSuperfluousSpaces(str: string): string {
  return str.replace(RE_TWO_OR_MORE_SPACES, CLASS_NAME_SEPARATOR)
}

const RE_TWO_OR_MORE_SPACES = /\s{2,}/g

```

</details>
<hr />


#### makeDomComponent(element: Element): (sinks: DomSinks) =\> DomSources

<p>

Takes an element and returns a DOM component function.

</p>


<details>
  <summary>See an example</summary>
  
```typescript
import { makeDomComponent, DomSources, DomSinks, VNode, div, button, h1 } from '@motorcycle/react-dom'
import { events, query } from '@motorcycle/dom'
import { run } from '@motorcycle/run'

const element = document.querySelector('#app')

if (!element) throw new Error('unable to find element')

run(UI, makeDomComponent(element))

function UI(sources: DomSources): DomSinks {
  const { dom } = sources

  const click$: Stream<Event> = events('click', query('button'))

  const amount$: Stream<number> = scan(x => x + 1, 0, click$)

  const view$: Stream<VNode> = map(view, amount$)

  return { view$ }
}

function view(amount: number) {
  return div([
    h1(`Clicked ${amount} times`),
    button(`Click me`)
  ])
}
```

</details>

<details>
<summary>See the code</summary>

```typescript

export function makeDomComponent(element: Element) {
  return function Dom(sinks: DomSinks): DomSources {
    const view$ = hold(sinks.view$)

    render(createElement(Container, { view$ }), element)

    const dom = createDomSource(hold(constant(element, view$)))

    return { dom }
  }
}

class Container extends Component<DomSinks, { view: VNode }> {
  private disposable: Disposable = NONE

  componentWillMount() {
    const { view$ } = this.props

    const event = (_: Time, view: VNode) => this.setState({ view })

    this.disposable = view$.run({ event, error: noop, end: noop }, scheduler)
  }

  componentWillUnmount() {
    const { disposable } = this

    this.disposable = NONE

    disposable.dispose()
  }

  render() {
    return (this.state && this.state.view) || createElement('div')
  }
}

const NONE: Disposable = { dispose: noop }

function noop(): void {}

```

</details>
<hr />
