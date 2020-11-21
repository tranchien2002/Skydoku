import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Board from './Board.js';
import Menu from './Menu.js';
import { Input, Button } from 'antd';
import 'bootstrap/dist/css/bootstrap.css';
import { SkynetClient, genKeyPairFromSeed } from 'skynet-js';

const skynetClient = new SkynetClient('https://siasky.net');
const { TextArea } = Input;
const filename = 'lastgame';
const score = 'bestScore';
let confettiBloom;

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      initial: 0,
      loggedIn: false,
      timeCounter: 0,
      start: false,
      openModal: true,
      change: false,
      seed: '',
      loading: false,
      recentGame: null,
      recentGameTime: 0,
      backGame: false,
      address: '',
      bestScore: 0
    };
    this.keyUpload = React.createRef();
    this.stopWatch = null;
  }

  handleGeneration = initial => {
    this.setState({ initial: initial, change: !this.state.change });
    clearInterval(confettiBloom);
  };

  loadRecentGame = async () => {
    await this.loadGame();
    this.setState({
      backGame: !this.state.backGame,
      start: true,
      timeCounter: this.state.recentGameTime
    });
    clearInterval(this.stopWatch);
    clearInterval(confettiBloom);
    this.stopWatch = setInterval(() => {
      this.setState({ timeCounter: this.state.timeCounter + 1 });
    }, 1000);
  };

  loadGame = async () => {
    try {
      let seed = this.state.seed;
      const { publicKey } = genKeyPairFromSeed(seed);
      const entry = await skynetClient.db.getJSON(publicKey, filename);
      if (entry) {
        let recentGame = JSON.parse(entry.data?.squares) ?? null;
        recentGame = recentGame.map(e => {
          e.classes = new Set(e.classes);
          return e;
        });
        if (recentGame) {
          this.setState({ recentGame: recentGame });
        }
        this.setState({
          recentGameTime: entry.data?.timeCounter ?? 0
        });
      }
    } catch (e) {
      console.log(e);
    }
  };

  loadScore = async () => {
    try {
      let seed = this.state.seed;
      const { publicKey } = genKeyPairFromSeed(seed);
      const entryScore = await skynetClient.db.getJSON(publicKey, score);
      console.log(entryScore);
      if (entryScore) {
        this.setState({ bestScore: entryScore.data?.bestScore ?? 0 });
      }
    } catch (e) {
      console.log(e);
    }
  };

  loadAddress = () => {
    let seed = this.state.seed;
    const { publicKey } = genKeyPairFromSeed(seed);
    this.setState({
      address:
        publicKey.slice(0, 10) + '...' + publicKey.slice(publicKey.length - 10, publicKey.length)
    });
  };

  login = async () => {
    this.setState({ loading: true });
    this.loadAddress();
    await this.loadGame();
    await this.loadScore();
    this.setState({ loading: false, loggedIn: true });
  };

  changeSeed = async e => {
    this.setState({ seed: e });
    await this.loadScore();
  };

  startGame = () => {
    if (!this.state.start) {
      clearInterval(this.stopWatch);
      this.setState({ timeCounter: 0, start: true });
      this.stopWatch = setInterval(() => {
        this.setState({ timeCounter: this.state.timeCounter + 1 });
      }, 1000);
    } else {
      clearInterval(this.stopWatch);
      this.setState({ timeCounter: 0 });
      this.stopWatch = setInterval(() => {
        this.setState({ timeCounter: this.state.timeCounter + 1 });
      }, 1000);
    }
  };

  endGame = () => {};

  renderMenu = () => {
    if (this.state.loggedIn) {
      return (
        <Menu
          onGenerate={this.handleGeneration}
          startGame={this.startGame}
          loadRecentGame={this.loadRecentGame}
          recentGame={this.state.recentGame}
        />
      );
    } else {
      return (
        <div>
          <TextArea
            rows={4}
            className='btn-login'
            onChange={e => this.changeSeed(e.target.value)}
          />
          <Button
            onClick={this.login.bind(this)}
            loading={this.state.loading}
            type='primary'
            className='btn-login'
          >
            Login
          </Button>
        </div>
      );
    }
  };

  submitScore = async () => {
    let seed = this.state.seed;
    const { privateKey } = genKeyPairFromSeed(seed);
    this.confettiEffect();
    try {
      if (this.state.timeCounter + 1 < this.state.bestScore || this.state.bestScore === 0) {
        await skynetClient.db.setJSON(privateKey, score, {
          bestScore: this.state.timeCounter
        });
        this.setState({ bestScore: this.state.timeCounter });
      }

      clearInterval(this.stopWatch);
    } catch (error) {
      console.log(error);
    }
  };

  renderTimer = () => {
    if (this.state.loggedIn) {
      return (
        <div>
          <h4 style={{ textAlign: 'center' }}>Address: {this.state.address}</h4>
          <h3 style={{ textAlign: 'center' }}>Timer: {this.state.timeCounter}</h3>
          <h5 style={{ textAlign: 'center' }}>Best score: {this.state.bestScore}</h5>
        </div>
      );
    }
  };

  handleClose = () => {
    this.setState({ openModal: false });
  };

  handleChange = e => {
    this.setState({ name: e.target.value });
  };

  confettiEffect = () => {
    // global variables
    const confetti = document.getElementById('confetti');
    const confettiCtx = confetti.getContext('2d');
    let container,
      confettiElements = [],
      clickPosition;
    // helper
    let rand = (min, max) => Math.random() * (max - min) + min;
    // params to play with
    const confettiParams = {
      // number of confetti per "explosion"
      number: 70,
      // min and max size for each rectangle
      size: { x: [5, 20], y: [10, 18] },
      // power of explosion
      initSpeed: 25,
      // defines how fast particles go down after blast-off
      gravity: 0.65,
      // how wide is explosion
      drag: 0.08,
      // how slow particles are falling
      terminalVelocity: 6,
      // how fast particles are rotating around themselves
      flipSpeed: 0.017
    };
    const colors = [
      { front: '#3B870A', back: '#235106' },
      { front: '#B96300', back: '#6f3b00' },
      { front: '#E23D34', back: '#88251f' },
      { front: '#CD3168', back: '#7b1d3e' },
      { front: '#664E8B', back: '#3d2f53' },
      { front: '#394F78', back: '#222f48' },
      { front: '#008A8A', back: '#005353' }
    ];
    setupCanvas();
    updateConfetti();
    confetti.addEventListener('click', addConfetti);
    window.addEventListener('resize', () => {
      setupCanvas();
      hideConfetti();
    });
    // Confetti constructor
    function Conf() {
      this.randomModifier = rand(-1, 1);
      this.colorPair = colors[Math.floor(rand(0, colors.length))];
      this.dimensions = {
        x: rand(confettiParams.size.x[0], confettiParams.size.x[1]),
        y: rand(confettiParams.size.y[0], confettiParams.size.y[1])
      };
      this.position = {
        x: clickPosition[0],
        y: clickPosition[1]
      };
      this.rotation = rand(0, 2 * Math.PI);
      this.scale = { x: 1, y: 1 };
      this.velocity = {
        x: rand(-confettiParams.initSpeed, confettiParams.initSpeed) * 0.4,
        y: rand(-confettiParams.initSpeed, confettiParams.initSpeed)
      };
      this.flipSpeed = rand(0.2, 1.5) * confettiParams.flipSpeed;
      if (this.position.y <= container.h) {
        this.velocity.y = -Math.abs(this.velocity.y);
      }
      this.terminalVelocity = rand(1, 1.5) * confettiParams.terminalVelocity;
      this.update = function () {
        this.velocity.x *= 0.98;
        this.position.x += this.velocity.x;
        this.velocity.y += this.randomModifier * confettiParams.drag;
        this.velocity.y += confettiParams.gravity;
        this.velocity.y = Math.min(this.velocity.y, this.terminalVelocity);
        this.position.y += this.velocity.y;
        this.scale.y = Math.cos((this.position.y + this.randomModifier) * this.flipSpeed);
        this.color = this.scale.y > 0 ? this.colorPair.front : this.colorPair.back;
      };
    }
    function updateConfetti() {
      confettiCtx.clearRect(0, 0, container.w, container.h);
      confettiElements.forEach(c => {
        c.update();
        confettiCtx.translate(c.position.x, c.position.y);
        confettiCtx.rotate(c.rotation);
        const width = c.dimensions.x * c.scale.x;
        const height = c.dimensions.y * c.scale.y;
        confettiCtx.fillStyle = c.color;
        confettiCtx.fillRect(-0.5 * width, -0.5 * height, width, height);
        confettiCtx.setTransform(1, 0, 0, 1, 0, 0);
      });
      confettiElements.forEach((c, idx) => {
        if (
          c.position.y > container.h ||
          c.position.x < -0.5 * container.x ||
          c.position.x > 1.5 * container.x
        ) {
          confettiElements.splice(idx, 1);
        }
      });
      window.requestAnimationFrame(updateConfetti);
    }
    function setupCanvas() {
      container = {
        w: confetti.clientWidth,
        h: confetti.clientHeight
      };
      confetti.width = container.w;
      confetti.height = container.h;
    }
    function addConfetti(e) {
      const canvasBox = confetti.getBoundingClientRect();
      if (e) {
        clickPosition = [e.clientX - canvasBox.left, e.clientY - canvasBox.top];
      } else {
        clickPosition = [canvasBox.width * Math.random(), canvasBox.height * Math.random()];
      }
      for (let i = 0; i < confettiParams.number; i++) {
        confettiElements.push(new Conf());
      }
    }
    function hideConfetti() {
      confettiElements = [];
      window.cancelAnimationFrame(updateConfetti);
    }
    addConfetti();
    // addConfetti();
    // addConfetti();
    // addConfetti();
    confettiBloom = setInterval(addConfetti, 1000);
  };

  render() {
    return (
      <div className='game'>
        <div className='game-board'>
          {this.renderTimer()}
          <Board
            key={1}
            initial={this.state.initial}
            change={this.state.change}
            start={this.state.start}
            submitScore={this.submitScore}
            recentGame={this.state.recentGame}
            backGame={this.state.backGame}
            timeCounter={this.state.timeCounter}
            seed={this.state.seed}
            address={this.state.address}
          />
          <canvas id='confetti' />
          <div className='game-menu'>
            <div className='game-menu'>{this.renderMenu()}</div>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Game />, document.getElementById('root'));
