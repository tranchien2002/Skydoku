import React from 'react';
import { Button } from 'antd';
import * as sg from './sudokuGenerator.js';
import { SkynetClient, genKeyPairFromSeed } from 'skynet-js';
var _ = require('lodash');

const skynetClient = new SkynetClient('https://siasky.net');
const filename = 'lastgame';
export default class Board extends React.PureComponent {
  constructor(props) {
    super(props);
    let startingBoard = sg.generateStartingBoard(this.props.initial);
    this.state = {
      squares: startingBoard,
      status: {
        msg: '',
        color: 'blue',
        openModal: true,
        loading: false,
        loadingSubmit: false
      }
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.change !== this.props.change) {
      let renewBoard = sg.generateStartingBoard(this.props.initial);

      this.setState({
        squares: renewBoard,
        status: {
          msg: '',
          color: 'blue',
          openModal: true
        }
      });
    }
    if (prevProps.backGame !== this.props.backGame && this.props.recentGame) {
      this.setState({ squares: this.props.recentGame });
    }
  }

  handleKeyPress = e => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  handleSubmit(e, i) {
    const squares = this.state.squares.slice();
    squares[i].value = e.target.value;
    this.setState({ squares: squares });
  }

  async handleValidation(squares) {
    const cells = sg.elementsToPositions(squares.slice());
    let emptyCells = cells.map(cell => cell.value === '').filter(v => v).length;
    let msg = 'No conflicts, ' + emptyCells + ' cells to go!';
    let color = 'blue';

    let neighbours;
    cells.forEach(cell => {
      cell.classes.delete(' conflict');
      if (cell.value) {
        neighbours = sg.getNeighbours(cell.coords, cells);
        neighbours.forEach((neighbour, i) => {
          if (neighbour) {
            if (String(neighbour.value) === String(cell.value)) {
              cell.classes.add(' conflict');
              msg = "Something's not quite right";
              color = 'red';
            }
          }
        });
      }
    });
    let newSquares = sg.elementsToPositions(cells);
    this.setState({
      squares: newSquares,
      status: {
        msg: msg,
        color: color
      }
    });

    // Check for win
    let hasConflict = cells
      .map(cell => cell.classes)
      .map(set => set.has(' conflict'))
      .includes(true);
    let hasEmpty = cells.map(cell => cell.value).includes('');
    if (!hasEmpty && !hasConflict) {
      this.setState({ loadingSubmit: true });
      await this.props.submitScore();
      this.setState({ loadingSubmit: false });
      this.setState({
        status: {
          msg: 'Puzzle Solved!!',
          color: 'green'
        }
      });
    }
  }

  createBoard() {
    let board = [];
    let row;
    let block;
    // Generate blocks
    for (let i = 0; i < 9; i++) {
      block = [];
      for (let j = 0; j < 3; j++) {
        row = [];
        for (let k = 0; k < 3; k++) {
          row.push(this.renderSquare(i * 9 + j * 3 + k));
        }
        block.push(
          <div className='board-row' key={j}>
            {row}
          </div>
        );
      }
      board.push(
        <div className='block' key={i}>
          {block}
        </div>
      );
    }
    board.push(
      <div>
        <Button
          className='validation'
          onClick={() => {
            this.handleValidation(this.state.squares);
          }}
          disabled={!this.props.start}
          key={'v-' + _.random(0, 1000)}
          loading={this.state.loadingSubmit}
        >
          Submit
        </Button>
        <Button
          disabled={!this.props.start}
          key={'v-' + _.random(0, 1000) + 1}
          onClick={() => {
            this.saveGame();
          }}
          loading={this.state.loading}
        >
          Save Game!
        </Button>
      </div>
    );
    board.push(
      <span
        className='status'
        key='stats'
        style={{
          color: this.state.status.color
        }}
      >
        {this.state.status.msg}
      </span>
    );

    return board;
  }

  async saveGame() {
    let seed = this.props.seed;
    const { privateKey } = genKeyPairFromSeed(seed);
    try {
      let squares = this.state.squares;
      squares = squares.map(e => {
        e.classes = Array.from(e.classes);
        return e;
      });
      let squresString = JSON.stringify(squares);
      this.setState({ loading: true });
      await skynetClient.db.setJSON(privateKey, filename, {
        squares: squresString,
        timeCounter: this.props.timeCounter
      });
      this.setState({ loading: false });
    } catch (error) {
      this.setState({ loading: false });
      console.log(error);
    }
  }

  renderSquare(i) {
    let disabled = false;
    if (this.state.squares[i].initial) {
      disabled = true;
    }

    let className = '';
    this.state.squares[i].classes.forEach(element => (className += element));

    return (
      <Square
        value={this.state.squares[i].value}
        disabled={disabled}
        className={className}
        key={i}
        onKeyDown={this.handleKeyPress}
        onChange={e => this.handleSubmit(e, i)}
      />
    );
  }

  handleClose = () => {
    this.setState({ openModal: false });
  };

  render() {
    return (
      <div>
        <h2 className='title'>SkyDoku</h2>
        {this.createBoard()}
      </div>
    );
  }
}

class Square extends React.Component {
  render() {
    return (
      <input
        value={this.props.value}
        type='text'
        disabled={this.props.disabled}
        pattern='[1-9]'
        maxLength='1'
        className={this.props.className}
        onChange={this.props.onChange}
        onKeyDown={this.props.onKeyDown}
      />
    );
  }
}
