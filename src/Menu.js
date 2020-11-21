import React from 'react';
import { FormGroup, ControlLabel, FormControl, Button } from 'react-bootstrap';
import './index.css';
export default class Menu extends React.Component {
  constructor(props) {
    super(props);
    this.initialFilled = 33;
    this.state = {
      loading: false
    };
  }

  renderOptions(start, end) {
    let result = [];
    for (let i = start; i < end; i++) {
      result.push(
        <option key={'option-' + i} value={String(i)}>
          {i}
        </option>
      );
    }
    return result;
  }
  async handleLoadRecentGame() {
    this.setState({ loading: true });
    await this.props.loadRecentGame();
    this.setState({ loading: false });
  }
  render() {
    return (
      <div>
        <h5>Generate New</h5>
        <form>
          <FormGroup controlId='formControlsSelect'>
            <ControlLabel>Initial cells</ControlLabel>
            <FormControl
              className='difficulty-select'
              defaultValue={this.initialFilled}
              inputRef={input => (this.initialFilled = input)}
              componentClass='select'
              placeholder='select'
            >
              <option value='17'>Extreme</option>
              <option value='33'>Medium</option>
              <option value='60'>Beginner</option>
            </FormControl>
          </FormGroup>
        </form>
        <Button
          className='generate-btn'
          onClick={() => {
            this.props.onGenerate(this.initialFilled.value);
            this.props.startGame();
          }}
        >
          New Game
        </Button>
        <p className='instructions'>Select the number of initial cells, then click new game!</p>
        <Button
          disabled={!this.props.recentGame}
          loading={this.state.loading}
          className='generate-btn'
          onClick={() => {
            this.handleLoadRecentGame();
          }}
        >
          Recent Game!
        </Button>
      </div>
    );
  }
}
