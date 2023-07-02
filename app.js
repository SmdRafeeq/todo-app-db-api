const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
let isValid = require("date-fns/isValid");

let db;

const dbConnection = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server started at http://localhost:3000");
    });
  } catch (err) {
    console.log(`Database  error is ${err.message}`);
    process.exit(1);
  }
};

dbConnection();

const hasPriorityAndStatusProperties = (obj) => {
  return obj.priority !== undefined && obj.status !== undefined;
};

const hasCategoryAndStatusProperties = (obj) => {
  return obj.category !== undefined && obj.status !== undefined;
};

const hasCategoryAndPriorityProperties = (obj) => {
  return obj.category !== undefined && obj.priority !== undefined;
};

const hasPriorityProperty = (obj) => {
  return obj.priority !== undefined;
};

const hasStatusProperty = (obj) => {
  return obj.status !== undefined;
};

const hasCategoryProperty = (obj) => {
  return obj.category !== undefined;
};

const hasSearchProperty = (obj) => {
  return obj.search_q !== undefined;
};

const convertDataIntoResponseObj = (obj) => {
  return {
    id: obj.id,
    todo: obj.todo,
    category: obj.category,
    priority: obj.priority,
    status: obj.status,
    dueDate: obj.due_date,
  };
};

// API 1

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status, category } = request.query;

  let data;
  let getTodoQuery = "";

  switch (true) {
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `select * from todo where status = "${status}";`;

        data = await db.all(getTodoQuery);
        response.send(data.map((each) => convertDataIntoResponseObj(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `select * from todo where priority = "${priority}";`;

        data = await db.all(getTodoQuery);
        response.send(data.map((each) => convertDataIntoResponseObj(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `select * from todo where priority = "${priority}"
                    and status = "${status}";`;

          data = await db.all(getTodoQuery);
          response.send(data.map((each) => convertDataIntoResponseObj(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasSearchProperty(request.query):
      getTodoQuery = `select * from todo where todo like "%${search_q}%";`;

      data = await db.all(getTodoQuery);
      response.send(data.map((each) => convertDataIntoResponseObj(each)));
      break;

    case hasCategoryAndStatusProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `select * from todo where category = "${category}" and status = "${status}";`;

          data = await db.all(getTodoQuery);
          response.send(data.map((each) => convertDataIntoResponseObj(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategoryProperty(request.query):
      if (
        category === "WORD" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `select * from todo where category = "${category}";`;

        data = await db.all(getTodoQuery);
        response.send(data.map((each) => convertDataIntoResponseObj(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategoryAndPriorityProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (priority === "HIGH" || priority === "LOW" || priority === "HIGH") {
          getTodoQuery = `select * from todo where category = "${category}" and priority = "${priority}";`;

          data = await db.all(getTodoQuery);
          response.send(data.map((each) => convertDataIntoResponseObj(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    default:
      getTodoQuery = `select * from todo;`;
      data = await db.all(getTodoQuery);
      response.send(data.map((each) => convertDataIntoResponseObj(each)));
  }
});

// API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `select * from todo where id = ${todoId};`;

  const dbResponse = await db.get(getTodoQuery);
  response.send(convertDataIntoResponseObj(dbResponse));
});

// API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");

    const getDateQuery = `select * from todo where due_date = "${newDate}";`;
    const dbResponse = await db.all(getDateQuery);

    response.send(dbResponse.map((res) => convertDataIntoResponseObj(res)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");

          const postQuery = `insert into todo (id, todo, priority, status, category, due_date)
                                        values (${id}, "${todo}", "${priority}", "${status}", "${category}", "${newDueDate}");`;
          await db.run(postQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//  API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateCol = "";
  const requestBody = request.body;

  const previousTodoQuery = `select * from todo where id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = requestBody;

  let updateTodo = "";

  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodo = `update todo set todo = "${todo}", priority = "${priority}", status = "${status}",
                            category = "${category}", due_date = "${dueDate}" where id = ${todoId};`;
        await db.run(updateTodo);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodo = `update todo set todo = "${todo}", priority = "${priority}", status = "${status}", 
                            category = "${category}", due_date = "${dueDate}" where id = ${todoId};`;
        await db.run(updateTodo);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case requestBody.todo !== undefined:
      updateTodo = `update todo set todo = "${todo}", priority = "${priority}", status = "${status}", category = "${category}",
                        due_date = "${dueDate}" where id = ${todoId}; `;

      await db.run(updateTodo);
      response.send("Todo Updated");
      break;

    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodo = `update todo set todo = "${todo}", priority = "${priority}", status = "${status}", category = "${category}",
                        due_date = "${dueDate}" where id = ${todoId};`;
        await db.run(updateTodo);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");

        updateTodo = `update todo set todo = "${todo}", priority = "${priority}", status = "${status}", category = "${category}",
                        due_date = "${dueDate}" where id = ${todoId};`;
        await db.run(updateTodo);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

// API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `delete from todo where id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
