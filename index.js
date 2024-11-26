import express from 'expres'
import cors from 'cors'

const app = express()
app.use(cors())




//käyttäjän luonti
app.post('/register',(req,res) => {
   
 
    pool.query('insert into users (email, password) values () returning *',
        [req.body.email.password],
        (error, result)=> {   
    if (error) {
        return res.status(500).json({error: error.message})
    }
    return res.status(200).json({id: result.rows[0].id})
})
})


app.post('/login',(req,res) => {
   
 
    pool.query('select * from users where email=',
        [req.body.name],
        (error, result)=> {   
    if (error) {
        return res.status(500).json({error: error.message})
    }
    return res.status(200).json({id: result.rows[0].id})
})
})











app.get('/',(req,res) => {
    
 
    pool.query('select * from user_group',(error, result)=> {   
    if (error) {
        return res.status(500).json({error: error.message})
    }
    return res.status(200).json(result.rows)
})
})

//ryhmän luonti
app.post('/create',(req,res) => {
   
 
    pool.query('insert into user_group (name) values ()',
        [req.body.name],
        (error, result)=> {   
    if (error) {
        return res.status(500).json({error: error.message})
    }
    return res.status(200).json({id: result.rows[0].id})
})
})

app.delete('/delete/:id',(req,res) => {
  
    const name = parseInt(req.params.name)
     pool.query('delete from user_group where name ',
        [name],
        (error, result)=> {   
    if (error) {
        return res.status(500).json({error: error.message})
    }
    return res.status(200).json({id: id})
})
})


app.listen(port)











