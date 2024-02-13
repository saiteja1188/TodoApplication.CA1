const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const format = require('date-fns/format')
const isValid = require('date-fns/isValid')
const toDate = require('date-fns/toDate')

const app = express()
app.use(express.json())
const dbpath = path.join(__dirname, 'todoApplication.db')

let db = null

const initialzeDbAndSever = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initialzeDbAndSever()

const checkRequestQuerys = async (request, response, next) => {
  const {todoId} = request.params
  const {search_q, priority, category, status, date} = request.query

  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const isPriorityIn = priorityArray.includes(priority)
    if (isPriorityIn === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }
  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const isCategoryIn = categoryArray.includes(category)
    if (isCategoryIn === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }
  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const isStatusIn = statusArray.includes(status)
    if (isStatusIn === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }
  if (date !== undefined) {
    try {
      const myDate = new Date(date)
      const formatDate = format(new Date(date), 'yyyy-MM-dd')
      console.log(formatDate, 'f')
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-
          ${myDate.getMonth() + 1}-
          ${myDate.getDate()}`,
        ),
      )
      console.log(result, 'r')

      console.log(new Date(), 'new')

      const isValidDate = await isValid(result)
      console.log(isValidDate, 'V')

      if (isValidDate === true) {
        request.ddate = formatDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }
  request.todoId = todoId
  request.search_q = search_q
  next()
}

const checkRequestBody = (request, response, next) => {
  const {id, todo, priority, category, status, dueDate} = request.body
  const {todoId} = request.params
  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const isPriorityIn = priorityArray.includes(priority)
    if (isPriorityIn === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const isCategoryIn = categoryArray.includes(category)
    if (isCategoryIn === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }
  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const isStatusIn = statusArray.includes(status)
    if (isStatusIn === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate)
      const formatDate = format(new Date(dueDate), 'yyyy-MM-dd')
      console.log(formatDate)
      const result = toDate(new Date(formatDate))
      const isValidDate = isValid(result)
      console.log(isValidDate)
      if (isValidDate === true) {
        request.dueDate = formatDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }
  request.id = id
  request.todo = todo

  request.todoId = todoId
  next()
}

app.get('/todos/', checkRequestQuerys, async (request, response) => {
  const {search_q = '', status = '', priority = '', category = ''} = request
  console.log(search_q, status, priority, category)
  const gettodosQuery = `
    SELECT
        id,
        todo,
        priority,
        status,
        category,
        due_date AS dueDate        
    FROM
        todo
    WHERE
        todo LIKE "%${search_q}%"
        AND priority LIKE "%${priority}%" 
        AND status LIKE "%${status}%" 
        AND category LIKE "%${category}%";
    `
  const todoArray = await db.all(gettodosQuery)
  response.send(todoArray)
})

app.get('/todos/:todoId/', checkRequestQuerys, async (request, response) => {
  const {todoId} = request
  const gettodosQuery = `
  SELECT 
      id,
      todo,
      priority,
      status,
      category,
      due_date AS dueDate
  FROM
      todo
  WHERE
      id = ${todoId};
  `
  const todo = await db.get(gettodosQuery)
  response.send(todo)
})
app.get('/agenda/', checkRequestQuerys, async (request, response) => {
  const {ddate} = request
  console.log(ddate, 'a')
  const gettodosQuery = `
  SELECT 
      id,
      todo,
      priority,
      status,
      category,
      due_date AS dueDate
  FROM
      todo
  WHERE
      due_date = "${ddate}";`
  const todoArray = await db.all(gettodosQuery)
  if (todoArray === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    response.send(todoArray)
  }
})

app.post('/todos', checkRequestBody, async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request
  const createQuery = `
  INSERT INTO
    todo (id, todo, priority, status, category, due_date)
  VALUES (${id}, "${todo}", "${priority}", "${status}", "${category}", "${dueDate}");
  `
  const test = await db.run(createQuery)
  response.send('Todo Successfully Added')
  //response.send(test)
})

app.put('/todos/:todoId/', checkRequestBody, async (request, response) => {
  const {todoId} = request.params
  const {status, priority, todo, category, dueDate} = request

  let updateQuery = null
  switch (true) {
    case status !== undefined:
      updateQuery = `
        UPDATE
          todo
        SET
          status = "${status}"
        WHERE
          id = ${todoId};
        `
      await db.run(updateQuery)
      response.send('Status Updated')
      break
    case priority !== undefined:
      updateQuery = `
        UPDATE
          todo
        SET
          priority = "${priority}"
        WHERE
          id = ${todoId};
        `
      await db.run(updateQuery)
      response.send('Priority Updated')
      break
    case todo !== undefined:
      updateQuery = `
        UPDATE
          todo
        SET
          todo = "${todo}"
        WHERE
          id = ${todoId};
        `
      await db.run(updateQuery)
      response.send('Todo Updated')
      break
    case category !== undefined:
      updateQuery = `
        UPDATE
          todo
        SET
          category = "${category}"
        WHERE
          id = ${todoId};
        `
      await db.run(updateQuery)
      response.send('Category Updated')
      break
    case dueDate !== undefined:
      updateQuery = `
        UPDATE
          todo
        SET
          due_date = "${dueDate}"
        WHERE
          id = ${todoId};
        `
      await db.run(updateQuery)
      response.send('Due Date Updated')
      break
  }
})

app.delete('/todos/:todoId/', checkRequestBody, async (request, response) => {
  const {todoId} = request
  const deleteQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};
  `
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
