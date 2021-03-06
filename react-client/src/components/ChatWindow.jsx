import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Segment, Confirm, Button, Header, Popup, Image, Modal, Content, Description, Sidebar, Menu, Transition,
         Icon, Form, Checkbox, Divider, Label, Grid, TextArea } from 'semantic-ui-react';
const uuidv4 = require('uuid/v4');

class ChatWindow extends React.Component {
  constructor(props) {
    super(props);

    let alert;

    this.botMessages = ['Beep boop I am a bot.', 'I will crush you.', 'You need to practice more.', 'I do not talk to humans.', 'All hail Skynet.'];
    this.state = {
      open: false,
      message: '',
      messageHistory: [],
      unread: 0,
      alert: false
    }
  }

  componentDidMount() {
    (async () => {
      let room = await this.props.room;
      await this.props.socket.emit('initMessages', { room: this.props.room });
      await this.props.socket.on('getHistory', () => {
        this.state.messageHistory.length && this.props.socket.emit('sendHistory', { messageHistory: this.state.messageHistory });
        this.props.socket.on('messageHistory', data => {
          this.setState({ messageHistory: data.messageHistory || [] });
        })
      })
      this.props.socket.on('newMessage', (data) => {
        this.setState({
          messageHistory: [...this.state.messageHistory, { message: data.message, username: data.username, socketId: data.socketId }]
        })
        if (data.hexbot) {
          setTimeout(() => {
            this.setState({
              messageHistory: [...this.state.messageHistory, { message: this.botMessages[Math.floor(Math.random() * this.botMessages.length)], username: 'hexbot', socketId: null }]
            });
          }, 1000);
        }
        if (!this.state.open) {
          alert = setInterval(() => {
            this.setState({ alert: !this.state.alert });
          }, 500);
          this.setState({ unread: this.state.unread += 1 });
        }
      });
    })();
  }

  handleChange(e, { value }) {
    this.setState({ message: value });
  }

  submitMessage() {
    (async () => {
      let room = await this.props.room;
      this.props.socket.emit('sendMessage', {
        message: this.state.message,
        username: this.props.loggedInUser,
        socketId: this.props.socket.id,
        room: this.props.room,
        hexbot: this.props.hexbot ? true : false
      });
      this.setState({ message: '' })
    })();
  }

  render() {
    const styles ={
      chatWindowClosed: {
        position: 'fixed',
        bottom: '-14px',
        right: '50px',
        width: '300px',
        backgroundColor: '#2185d0'
      },
      chatWindowAlert: {
        position: 'fixed',
        bottom: '-14px',
        right: '50px',
        width: '300px',
        backgroundColor: '#ff0000'
      },
      chatWindowOpen: {
        position: 'fixed',
        bottom: '264px',
        right: '50px',
        width: '300px',
        zIndex: 100000,
        backgroundColor: '#21ba45'
      },
      chatBody: {
        position: 'fixed',
        bottom: 0,
        right: '50px',
        width: '300px',
        height: '280px',
        zIndex: -50000
      }
    }
    let socket = this.props.socket;
    return (
      <Segment style={this.state.open ? styles.chatWindowOpen : this.state.alert ? styles.chatWindowAlert : styles.chatWindowClosed}>
        <Header style={{display: 'inline'}}>Chat <span style={{fontWeight: 'normal', fontSize: '15px'}}>{this.state.unread > 0 ? `(${this.state.unread} unread message${this.state.unread === 1 ? `` : `s`})` : null}</span></Header>
        <Icon
          onClick={() => {
            this.setState({ open: !this.state.open, alert: false, unread: 0 });
            clearInterval(alert);
          }}
          className={'chatIcon'}
          name={this.state.open ? 'compress' : 'expand'}/>
        {this.state.open &&
            <Segment style={styles.chatBody}>
              <Form>
                <Segment style={{height: '160px', overflowY: 'scroll', border: '1px solid grey'}}>
                  {this.state.messageHistory && this.state.messageHistory.map(message => {
                    return (
                      <p key={uuidv4()}>
                        <strong
                          style={{color: message.socketId === this.props.socket.id ?
                            'blue': 'red'}}>{message.username}:
                        </strong>
                        <span> </span>
                        {message.message}
                      </p>
                    )
                  })}
                </Segment>
                <TextArea
                  style={{height: '45px', overflowY: 'scroll', border: '1px solid grey'}}
                  placeholder={'Say hi!'}
                  value={this.state.message}
                  onChange={this.handleChange.bind(this)}
                  />
                <Button
                  style={{float: 'right', marginTop: '10px'}}
                  size={'tiny'}
                  type={'submit'}
                  onClick={this.submitMessage.bind(this)}
                  >
                Send
              </Button>
              </Form>
            </Segment>
        }
      </Segment>
    )
  }
}

const mapStateToProps = state => {
  return {
    socket: state.state.socket,
    room: state.state.room,
    loggedInUser: state.state.loggedInUser,
    hexbot: state.state.hexbot
  }
}

const mapDispatchToProps = dispatch => {
  return bindActionCreators({ }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ChatWindow);
