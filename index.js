const inquirer = require('inquirer');
const mysql = require('mysql2');
const cTable = require('console.table');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password', // Replace with your MySQL password
  database: 'employee_tracker'
});

connection.connect(err => {
  if (err) throw err;
  console.log('Connected to the database.');
  start();
});

function start() {
  inquirer.prompt({
    name: 'action',
    type: 'list',
    message: 'What would you like to do?',
    choices: [
      'View All Departments',
      'View All Roles',
      'View All Employees',
      'Add Department',
      'Add Role',
      'Add Employee',
      'Update Employee Role',
      'Exit'
    ]
  }).then(answer => {
    switch (answer.action) {
      case 'View All Departments':
        viewAllDepartments();
        break;
      case 'View All Roles':
        viewAllRoles();
        break;
      case 'View All Employees':
        viewAllEmployees();
        break;
      case 'Add Department':
        addDepartment();
        break;
      case 'Add Role':
        addRole();
        break;
      case 'Add Employee':
        addEmployee();
        break;
      case 'Update Employee Role':
        updateEmployeeRole();
        break;
      case 'Exit':
        connection.end();
        break;
    }
  });
}

function viewAllDepartments() {
  const query = 'SELECT * FROM department';
  connection.query(query, (err, res) => {
    if (err) throw err;
    console.table(res);
    start();
  });
}

function viewAllRoles() {
  const query = `SELECT role.id, role.title, department.name AS department, role.salary 
                 FROM role 
                 LEFT JOIN department ON role.department_id = department.id`;
  connection.query(query, (err, res) => {
    if (err) throw err;
    console.table(res);
    start();
  });
}

function viewAllEmployees() {
  const query = `SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, 
                 CONCAT(manager.first_name, ' ', manager.last_name) AS manager 
                 FROM employee 
                 LEFT JOIN role ON employee.role_id = role.id 
                 LEFT JOIN department ON role.department_id = department.id 
                 LEFT JOIN employee manager ON manager.id = employee.manager_id`;
  connection.query(query, (err, res) => {
    if (err) throw err;
    console.table(res);
    start();
  });
}

function addDepartment() {
  inquirer.prompt({
    name: 'name',
    type: 'input',
    message: 'What is the name of the department?'
  }).then(answer => {
    const query = 'INSERT INTO department SET ?';
    connection.query(query, { name: answer.name }, (err, res) => {
      if (err) throw err;
      console.log('Added department to the database.');
      start();
    });
  });
}

function addRole() {
  connection.query('SELECT * FROM department', (err, departments) => {
    if (err) throw err;
    inquirer.prompt([
      {
        name: 'title',
        type: 'input',
        message: 'What is the name of the role?'
      },
      {
        name: 'salary',
        type: 'input',
        message: 'What is the salary of the role?'
      },
      {
        name: 'department_id',
        type: 'list',
        message: 'Which department does the role belong to?',
        choices: departments.map(department => ({ name: department.name, value: department.id }))
      }
    ]).then(answer => {
      const query = 'INSERT INTO role SET ?';
      connection.query(query, answer, (err, res) => {
        if (err) throw err;
        console.log('Added role to the database.');
        start();
      });
    });
  });
}

function addEmployee() {
  connection.query('SELECT * FROM role', (err, roles) => {
    if (err) throw err;
    connection.query('SELECT * FROM employee', (err, employees) => {
      if (err) throw err;
      inquirer.prompt([
        {
          name: 'first_name',
          type: 'input',
          message: "What is the employee's first name?"
        },
        {
          name: 'last_name',
          type: 'input',
          message: "What is the employee's last name?"
        },
        {
          name: 'role_id',
          type: 'list',
          message: "What is the employee's role?",
          choices: roles.map(role => ({ name: role.title, value: role.id }))
        },
        {
          name: 'manager_id',
          type: 'list',
          message: "Who is the employee's manager?",
          choices: [{ name: 'None', value: null }].concat(employees.map(employee => ({ name: `${employee.first_name} ${employee.last_name}`, value: employee.id })))
        }
      ]).then(answer => {
        const query = 'INSERT INTO employee SET ?';
        connection.query(query, answer, (err, res) => {
          if (err) throw err;
          console.log('Added employee to the database.');
          start();
        });
      });
    });
  });
}

function updateEmployeeRole() {
  connection.query('SELECT * FROM employee', (err, employees) => {
    if (err) throw err;
    connection.query('SELECT * FROM role', (err, roles) => {
      if (err) throw err;
      inquirer.prompt([
        {
          name: 'employee_id',
          type: 'list',
          message: "Which employee's role do you want to update?",
          choices: employees.map(employee => ({ name: `${employee.first_name} ${employee.last_name}`, value: employee.id }))
        },
        {
          name: 'role_id',
          type: 'list',
          message: 'Which role do you want to assign to the selected employee?',
          choices: roles.map(role => ({ name: role.title, value: role.id }))
        }
      ]).then(answer => {
        const query = 'UPDATE employee SET role_id = ? WHERE id = ?';
        connection.query(query, [answer.role_id, answer.employee_id], (err, res) => {
          if (err) throw err;
          console.log('Updated employee role.');
          start();
        });
      });
    });
  });
}
