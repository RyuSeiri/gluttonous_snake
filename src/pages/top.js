import React, { Component } from 'react';
import Header from '../component/header/header';
import { Card, Button, Row, Col } from 'react-bootstrap';

export default class Top extends Component {
  state = {
    score: 0,
    message: "",
    startBtnDisabled: false,
    daoju: false,
    zhangaiwu: false,
  }
  // global
  WIDTH = 20; //网格宽度
  HEIGHT = 20; //网格高度
  len = 3; //蛇的长度
  speed; //爬行速度
  gridElems;//单元格对象
  carrier; //承载对象(食物，障碍，滑板，刹车)
  snake; //蛇每节的坐标点
  info; //交互对话
  topScore = this.len;
  snakeTimer; //蛇行走计时器
  brakeTimers = []; //随机刹车
  skateTimers = []; //随机滑板
  directkey; // 方向键值 37-40 左上右下

  constructor(props) {
    super(props);
    this.tableContainer = React.createRef();
  }

  /**
   * 初期化
   */
  componentDidMount() {
    this.gridElems = this.multiArray(this.WIDTH, this.HEIGHT);
    this.initGrid(); //网格初始化
    document.onkeydown = this.attachEvents; //绑定方向事件
  }

  /**
   * 卸载
   */
  componentWillUnmount() {
    if (this.snakeTimer) clearInterval(this.snakeTimer);
  }


  /**
   * 值改变·
   * @param {*} e 
   */
  commonChange = (e) => {
    this.setState({ [e.target.name]: e.target.checked });
  }

  //开始游戏
  start = (e) => {
    e.preventDefault();
    this.setState({ startBtnDisabled: true });
    this.len = 3;
    this.speed = 10;
    this.directkey = 39;
    this.carrier = this.multiArray(this.WIDTH, this.HEIGHT);
    this.snake = [];
    this.setState({ message: "" });
    this.clear();
    this.initSnake(); //蛇初始化
    this.addObject("food");
    this.walk();
    this.addRandomBrake();
  }

  //创建网格
  initGrid = () => {
    var table = document.createElement("table"),
      tbody = document.createElement("tbody")
    const { HEIGHT, WIDTH } = this;
    for (var j = 0; j < HEIGHT; j++) {
      var col = document.createElement("tr");
      for (var i = 0; i < WIDTH; i++) {
        var row = document.createElement("td");
        this.gridElems[i][j] = col.appendChild(row);
      }
      tbody.appendChild(col);
    }
    table.appendChild(tbody);
    table.style.margin = "0 auto";
    this.tableContainer.current.appendChild(table);
  }

  //创建蛇
  initSnake = () => {
    let pointer = this.randomPointer(this.len - 1, this.len - 1, this.WIDTH / 2);
    for (let i = 0; i < this.len; i++) {
      let x = pointer[0] - i,
        y = pointer[1];
      this.snake.push([x, y]);
      this.carrier[x][y] = "cover";
    }
  }

  //添加键盘事件
  attachEvents = (e) => {
    this.directkey = Math.abs(e.keyCode - this.directkey) !== 2 && e.keyCode > 36 && e.keyCode < 41 ? e.keyCode : this.directkey; //非方向键、反向无效
    return false;
  }

  /**
   * 蛇走
   */
  walk = () => {
    if (this.snakeTimer) clearInterval(this.snakeTimer);
    this.snakeTimer = setInterval(() => { this.step() }, Math.floor(3000 / this.speed));
  }

  /**
   * 蛇走一步
   */
  step = () => {
    //获取目标点
    let headX = this.snake[0][0],
      headY = this.snake[0][1];
    switch (this.directkey) {
      case 37:
        headX -= 1;
        break;
      case 38:
        headY -= 1;
        break;
      case 39:
        headX += 1;
        break
      case 40:
        headY += 1;
        break;
      default:
        break;
    }

    //碰到边界，阻挡物，则结束游戏
    if (headX >= this.WIDTH || headX < 0 || headY >= this.HEIGHT || headY < 0 || this.carrier[headX][headY] === "block" || this.carrier[headX][headY] === "cover") {
      this.setMessage("GAME OVER");
      this.setState({ startBtnDisabled: false });
      clearInterval(this.snakeTimer);
      for (let i = 0; i < this.brakeTimers.length; i++) clearTimeout(this.brakeTimers[i]);
      for (let i = 0; i < this.skateTimers.length; i++) clearTimeout(this.skateTimers[i]);
      return;
    }

    //加速
    if (this.len % 4 === 0 && this.speed < 60 && this.carrier[headX][headY] === "food") {
      this.speed += 5;
      this.walk();
      this.setMessage("加速！");
    }

    //捡到刹车
    if (this.carrier[headX][headY] === "brake") {
      this.speed = 5;
      this.walk();
      this.setMessage("恭喜！捡到刹车一个。");
    }

    //遭遇滑板
    if (this.carrier[headX][headY] === "skate") {
      this.speed += 20;
      this.walk();
      this.setMessage("遭遇滑板！");
    }

    //添加阻挡物
    if (this.state.zhangaiwu && this.len % 6 === 0 && this.len < 60 && this.carrier[headX][headY] === "food") {
      this.addObject("block");
    }

    //吃东西
    if (this.carrier[headX][headY] !== "food") {
      let lastX = this.snake[this.snake.length - 1][0],
        lastY = this.snake[this.snake.length - 1][1];
      this.carrier[lastX][lastY] = false;
      this.gridElems[lastX][lastY].className = "";
      this.snake.pop();
    } else {
      this.carrier[headX][headY] = false;
      this.addObject("food");
    }

    this.snake.unshift([headX, headY]);
    this.carrier[headX][headY] = "cover";
    this.gridElems[headX][headY].className = "cover";
    this.len = this.snake.length;
    this.setState({ score: this.len - 3 })
  }

  //添加物品
  addObject = (name) => {
    let p = this.randomPointer();
    this.carrier[p[0]][p[1]] = name;
    this.gridElems[p[0]][p[1]].className = name;
  }

  //添加随机数量刹车和滑板
  addRandomBrake = () => {
    if (this.state.daoju) {
      let num = this.randowNum(1, 5);
      for (let i = 0; i < num; i++) {
        this.brakeTimers.push(setTimeout(() => { this.addObject("brake") }, this.randowNum(10000, 100000)));
        this.skateTimers.push(setTimeout(() => { this.addObject("skate") }, this.randowNum(5000, 100000)));
      }
    }
  }

  /**
   * 设置message
   * @param {*} msg 消息
   */
  setMessage = (msg) => {
    this.setState({ message: msg });
  }

  //创建二维数组
  multiArray = (m, n) => {
    let arr = new Array(n);
    for (let i = 0; i < m; i++)
      arr[i] = new Array(m);
    return arr;
  }

  //清除画面
  clear = () => {
    for (let y = 0; y < this.gridElems.length; y++) {
      for (let x = 0; x < this.gridElems[y].length; x++) {
        this.gridElems[x][y].className = "";
      }
    }
  }

  //产生指定范围随机点
  randomPointer = (startX, startY, endX, endY) => {
    startX = startX || 0;
    startY = startY || 0;
    endX = endX || this.WIDTH;
    endY = endY || this.HEIGHT;
    let p = [],
      x = Math.floor(Math.random() * (endX - startX)) + startX,
      y = Math.floor(Math.random() * (endY - startY)) + startY;
    if (this.carrier[x][y]) return this.randomPointer(startX, startY, endX, endY);
    p[0] = x;
    p[1] = y;
    return p;
  }

  //产生随机整数
  randowNum = (start, end) => {
    return Math.floor(Math.random() * (end - start)) + start;
  }



  render() {

    const styles = {
      container: {
        margin: '10em auto',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      },
      centerContainer: {
        height: '35.5em',
        // border: '1px solid'
      },
      centerCard: {
        height: '100%',
      },
      tableContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      },
      checkboxContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      },
    };

    return (
      <React.Fragment>
        <div style={styles.container}>
          <Card className="card-container">
            <Card.Body>
              <Row>
                <Col md={12}>
                  <Header title="贪食蛇" />
                </Col>
              </Row>
              <Row className="justify-content-md-center">
                <Col md={12} style={styles.centerContainer}>
                  <Card style={styles.centerCard}>
                    <Card.Body>
                      <Row>
                        <Col md={12} className="content-center">
                          {this.state.message}
                        </Col>
                        <Col md={12} className="content-center">
                          <span>当前分数:
                          <strong>{this.state.score}</strong>
                          </span>
                        </Col>
                        <Col md={12} className="content-center">
                          <div ref={this.tableContainer}></div>
                        </Col>
                        <Col md={12} className="content-center">
                          <span className="box food"></span>
                          <span>绿色食物</span>
                          <span className="box block"></span>
                          <span>灰色毒品</span>
                          <span className="box skate"></span>
                          <span>蓝色滑板</span>
                          <span className="box brake"></span>
                          <span>红色刹车</span>
                        </Col>
                        <Col md={12}>
                          <div style={styles.checkboxContainer}>
                            <div class="form-check">
                              <input class="form-check-input" name='daoju' type="checkbox" disabled={this.state.startBtnDisabled} onChange={this.commonChange} value={this.state.daoju} />
                              <label class="form-check-label">
                                启用道具
                            </label>
                            </div>
                            <div class="form-check">
                              <input class="form-check-input" type="checkbox" name='zhangaiwu' disabled={this.state.startBtnDisabled} onChange={this.commonChange} value={this.state.zhang} />
                              <label class="form-check-label">
                                启用障碍物
                            </label>
                            </div>
                          </div>
                          <Col md={12} className="content-center">
                            <Button onClick={this.start} disabled={this.state.startBtnDisabled}>开始游戏</Button>
                          </Col>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </div>
      </React.Fragment >
    )
  }
}
