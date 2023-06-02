const mongoose=require('mongoose')
mongoose.connect('mongodb+srv://Pr9:pr9j1610@cluster0.inutoi5.mongodb.net/test')

const Logistics = mongoose.model('Logistics', { 
    Type:String,
    CompanyName:String,
    CompanyEmail:String,
    CompanyAddress:String,
    
    Password:String,
    Orders:Array,
    Messages:Array,

});


module.exports=Logistics

