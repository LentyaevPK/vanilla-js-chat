const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const users = require('./users')()

const m = (name, text, id) => ({name, text, id})

io.on('connection', socket => {

    socket.on('userJoined', (data, cb) => {
        if(!data.name || !data.room) {
            return cb('Данные некорректны')
        }

        socket.join(data.room)

        users.remove(socket.id)
        users.add({
            id: socket.id,
            name: data.name,
            room: data.room,
            letter: data.letter
        })
        
        cb({userId: socket.id})
        io.to(data.room).emit('updateUsers', users.getByRoom(data.room))
        socket.emit('newMessage', m('admin', `Добро пожаловать ${data.name}`))
        socket.broadcast
            .to(data.room)
            .emit('newMessage', m('admin', `Пользователь ${data.name} присоединился`))
    })

    socket.on('createMsg', (data, cb) => {
        if(!data.text) {
            cb('Введите текст')
            return
        }

        const user = users.get(data.id)
        if(user) {
            io.to(user.room).emit('newMessage', m(user.name, data.text, data.id))
        }
        cb()
    })

    socket.on('showTypingUser', data => {
        const user = users.get(data.id)

        socket.broadcast
            .to(data.room)
            .emit('addTypingUsers', user)
    })

    socket.on('removeTypingUser', data => {
        const user = users.get(data.id)

        socket.broadcast
            .to(data.room)
            .emit('deleteTypingUser', user)
    })

    socket.on('userLeft', (id, cb) => {
        const user = users.remove(id)

        if(user) {
            io.to(user.room).emit('updateUsers', users.getByRoom(user.room))
            io.to(user.room).emit('newMessage', m('admin', `Пользователь ${user.name} вышел`))
        }
        cb()
    })

    socket.on('disconnect', () => {
        const user = users.remove(socket.id)

        if(user) {
            io.to(user.room).emit('updateUsers', users.getByRoom(user.room))
            io.to(user.room).emit('newMessage', m('admin', `Пользователь ${user.name} вышел`))
        }
    })
})


const PORT = process.env.PORT || 3000

http.listen(PORT, () => {
    console.log(`Server has been started on port ${PORT}...`)
})