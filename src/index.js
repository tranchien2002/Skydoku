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
  };

  loadRecentGame = async () => {
    await this.loadGame();
    this.setState({
      backGame: !this.state.backGame,
      start: true,
      timeCounter: this.state.recentGameTime
    });
    clearInterval(this.stopWatch);
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
      this.setState({ timeCounter: 0 });
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
    try {
      if (this.state.timeCounter < this.state.bestScore) {
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
          <div className='game-menu'>
            <div className='game-menu'>{this.renderMenu()}</div>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Game />, document.getElementById('root'));
