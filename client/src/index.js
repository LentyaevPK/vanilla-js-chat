import './css/styles.css'
import io from 'socket.io-client'

const socket = io('http://localhost:3000/')

const app = document.getElementById('app')

let mainUser = {}

socket.on('connect', () => {
    console.log('socket connected')
})

socket.on('updateUsers', (users) => {
    renderUsers(users)
})

socket.on('newMessage', (msg) => {
    createMsg(msg)
})

function renderForm() {
    app.innerHTML = `<form action="" class="room__form"><label for="">Ваше имя</label><input type="text"  class="room__username"><label for="">Название комнаты</label><input type="text" class="room__name"><button type="submit" class="room__submit">Создать</button><button class="room__reset-form">Сбросить</button></form>`

    const resetFormBtn = document.querySelector('.room__reset-form')
    resetFormBtn.addEventListener('click', resetForm)

    const submitFormBtn = document.querySelector('.room__submit')
    submitFormBtn.addEventListener('click', submitForm)
}

function renderChatPage(user) {
    app.innerHTML = `<div class="chat">
    <header class="chat__header"><button class="chat__exit-btn">Выйти из комнаты</button>Чат комнаты ${user.room}</header>
    <aside class="chat__users"></aside>
    <div class="chat__messages">
        <div class="chat__message-list"></div>
        <input type="text" class="chat__message-input"> 
    </div>
    </div>`

    const exitBtn = document.querySelector('.chat__exit-btn')
    exitBtn.addEventListener('click', leaveRoom)

    const msgInput = document.querySelector('.chat__message-input')
    msgInput.addEventListener('keydown', sendMsg)
}

function renderUsers(users) {
    const userList = document.querySelector('.chat__users')
    userList.innerHTML = ''

    users.forEach(user => {
        let div = document.createElement('div')
        div.innerHTML = `${user.name}`

        userList.appendChild(div)
    })
}

function submitForm(e) {
    let username = document.querySelector('.room__username').value
    let roomname = document.querySelector('.room__name').value

    const user = {
        name: username,
        room: roomname
    }

    socket.emit('userJoined', user, data => {
        if(typeof data === 'string') {
            console.error(data)
        } else {
            user.id = data.userId
            mainUser = {...user}
            username = ''
            roomname = ''
            renderChatPage(user)
        }
    })

    e.preventDefault()
}

function resetForm(e) {
    e.preventDefault()
    document.querySelector('.room__username').value = ''
    document.querySelector('.room__name').value = ''
}

function leaveRoom() {
    socket.emit('userLeft', mainUser.id, () => {
        mainUser = {}
        renderForm()
    })
}

function sendMsg(e) {
    if (e.code === 'Enter') {
        let msg = {
            text: this.value.trim(),
            id: mainUser.id
        }

        socket.emit('createMsg', msg, data => {
            if(typeof data === 'string') {
                console.error(data)
            } else {
                this.value = ''
            }
        })
    }
}

function createMsg(msg) {
    let msgItem = document.createElement('div')
    msgItem.classList.add('chat__message-wrapper')
    let msgType = ''
    if(msg.name === 'admin') {
        msgType = 'admin'
    } else if (msg.id === mainUser.id) {
        msgType = 'owner'
    } else {
        msgType = 'user'
    }
    msgItem.innerHTML = `<div class="chat__message-item--${msgType}">${msg.name === 'admin' ? '' : `<div class="chat__message-name">${msg.name}</div>`}
    <div class="chat__message-text">${msg.text}</div></div>`

    const msgList = document.querySelector('.chat__message-list')                

    msgList.appendChild(msgItem)

    const msgWrapper = document.querySelector('.chat__messages')

    msgWrapper.scrollTop = msgWrapper.scrollHeight    
}

renderForm()