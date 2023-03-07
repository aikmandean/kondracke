
type Task = {output: unknown}
type TaskArrOutput<T extends Task[],V extends [] = []> =
    T extends [infer F, ...infer R] 
    ? TaskArrOutput<R,[...V,F["output"]]> 
    : V
type RunningTask<T> = {
    getMetadata(): Promise<{
        taskId: string
        metaTaskId: string
    }>
    getResult(): Promise<T>
}
type Manual<I,O> = { 
    output: O
    define(callback: (props: I) => O): void
    run(props: I)
}
type Reaction<I extends Task,O> = { 
    output: O
    define(callback: (props: I["output"]) => O): void
}
type Pipe<I,O,T extends Task[]> = { 
    output: O
    define(callback: (props: I, ...t: TaskArrOutput<T>) => O): void
    run(props: I, ...t: T)
}



export function attachCelery(newProducer: ReturnType<typeof makeCelery["createClient"]>, newConsumer: ReturnType<typeof makeCelery["createClient"]>): void
export function declareTask<I,O>(name: string, output: O, input: I): Manual<I,O>
export function declareSchedule<I,O,T extends Task[]>(name: string, output: O, input: I, ...inputTasks: T): Pipe<I,O,T>
export function declareReaction<I extends Task,O>(name: string, output: O, inputTask: I): Reaction<I,O>

const Add = declareTask("ADDITION", {result:0}, {a:0,b:0})
const Multiply = declareTask("MULTIPLY", {result:0}, {a:0,b:0})
const SumBoth = declareSchedule("SUM", {finalResult:""}, {}, Add, Multiply)

// TASK WORKER.js
Add.define(props => {
    const result = props.a + props.b
    return { result }
})
Multiply.define(props => {
    const result = props.a * props.b
    return { result }
})
SumBoth.define((props, add, multiply) => {
    return { finalResult: `Add: ${add.result}, Multiply: ${multiply.result}` }
})


// WEBSERVER.js
const runningAdd = Add.run({ a: 5, b: 17 })
const runningMultiply = Multiply.run({ a: 2, b: 12 })

SumBoth.run({}, runningAdd, runningMultiply)
