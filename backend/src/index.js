const express = reuqire('express');
const app = express();
const helmet = require('helmet')
const cors = require('cors')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
