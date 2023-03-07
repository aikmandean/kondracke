import makeCelery from "celery-node"

export {
    attachCelery,
    declareTask,
    declareReaction,
    declareSchedule
}

/** @type {ReturnType<typeof makeCelery["createClient"]>} */
var producer
/** @type {ReturnType<typeof makeCelery["createWorker"]>} */
var consumer
function attachCelery(newProducer, newConsumer) {
    producer = newProducer
    consumer = newConsumer
}

/** @type {Record<string, ReturnType<typeof producer["createTask"]>[]>} */
const reactions = {}
/** @type {Record<string, boolean>>} */
const schedules = {}

function declareTask(name) {
    const taskCreator = producer.createTask(name)
    reactions[name] = []
    return {
        name,
        define(callback) {
            consumer.register(name, async (props, ...activeTaskIds) => {
                try {
                    if(activeTaskIds.length == 1) {
                        const result = await callback(props)
                        reactions[name].forEach(task => task.run(result))
                        return result
                    }
                    // else {
                    //     activeTaskIds.forEach(taskId => taskId in schedules ? {} : schedules[taskId] = false)
                    //     schedules[]
                    //     activeTaskIds.pop()
                    //     const waitingResults = activeTaskIds.map(x => producer.asyncResult(x).get())
                    //     const activeResults = await Promise.all(waitingResults)

                    //     const result = await callback(props, ...activeResults)
                    //     reactions[name].forEach(task => task.run(result))
                    //     return result
                    // }
                    
    
                } catch (error) {
                    console.error({error})
                    throw error
                }
            })
        },
        run(props = {}, ...activeTasks) {
            return taskCreator.applyAsync([props].concat(activeTasks.map(t => t.taskId)))
        }
    }   
}
function declareReaction(name, output, inputTask) {
    const taskConstructor = declareTask(name)
    reactions[inputTask.name].push(taskConstructor)
    return taskConstructor
}
function declareSchedule(name) {
    const taskConstructor = declareTask(name)
    return taskConstructor
}
