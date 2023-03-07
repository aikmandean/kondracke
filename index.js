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

let runningTaskId = ""

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
            consumer.register(name, async function (props, ...activeTaskIds) {
                try {
                    if(activeTaskIds.length == 1) {
                        const result = await callback(props)
                        reactions[name].forEach(task => task.run(result))
                        return result
                    }
                    else {
                        activeTaskIds.pop()
                        const waitingResults = activeTaskIds.map(x => producer.asyncResult(x).get())
                        const activeResults = await Promise.all(waitingResults)
                        // console.log("Active restults: ", activeResults);
                        const result = await callback(props, ...activeResults)
                        // console.log("Result: ", result);
                        reactions[name].forEach(task => task.run(result))
                        return result
                    }
                    
    
                } catch (error) {
                    console.error({error})
                    throw error
                }
            })
        },
        run(props = {}, ...activeTasks) {
            const latestTask = taskCreator.applyAsync([props].concat(activeTasks.map(t => t.taskId)))
            runningTaskId = latestTask.taskId
            return latestTask
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
