function Promise(executor){
    //executor是执行器函数，执行器函数是同步调用的
    /** new Promise((resolve,reject) => {
            resolve("ok")
        })
    也即这里的形参(resolve,reject) => {
            resolve("ok")
        }
    */
    this.PromiseState = "pendding";
    this.PromiseResult = null;
    //如果不在这里保存this的话，
    //在执行resolve("ok")方法的时候
    // resolve方法中的this.PromiseState里面的this指向的是window
    // 但是我们希望的是他指向的是
    const self = this;
    // 用于保存由于异步原因 延迟修改完promise状态后，才执行的回调函数
    // this.callback={}
    this.callbacks = []
    
    function resolve(data){
        // 判断状态 用于实现promise对象状态只能修改一次
        if(self.PromiseState != 'pendding') return 
        //1.修改Promise对象的状态（promiseState）
        self.PromiseState = "fullfilled"
        //2.设置对象的结果值(promiseResult)
        self.PromiseResult = data;
        // 异步任务执行成功后执行回调函数
        // if(self.callback.onResolved){
        //     self.callback.onResolved(data)
        // }
        console.log(self.PromiseState,self.PromiseResult)
        self.callbacks.forEach(item => {
            if(item.onResolved){
                item .onResolved(data)
            }
        }) 

    }

    function reject(data){
        // 判断状态 用于实现promise对象状态只能修改一次
        if(self.PromiseState != 'pendding') return 
        //1.修改Promise对象的状态（promiseState）
        self.PromiseState = "rejected"
        //2.设置对象的结果值(promiseResult)
        self.PromiseResult = data;
        // 异步任务执行成功后执行回调函数
        //  if(self.callback.onRejected){
        //     self.callback.onRejected(data)
        // }
        self.callbacks.forEach(item => {
            if(item.onRejected){
                item .onRejected(data)
            }
        }) 
    }

    // 只有将执行器函数用trycatch抱起来，
    // 才能在抛出异常时用throw做出正确的异常反应
    try {
        executor(resolve,reject);
    } catch (error) {
        //修改PromiseState为失败，并拿到异常抛出的时候传递的参数
        reject(error)
    }
    


}

Promise.prototype.then = function(onResolved,onRejected){
    const self = this;
    // 封装函数
    function callback (type){
        try {
            let result = type(self.PromiseResult);
            console.log("res",result)
            if(result instanceof Promise){
                //如果返回的对象本来就是一个Promise对象
                // 那就直接返回这个Promise对象
                result.then(value => {
                    resolve(value)
                },err =>{
                    reject(err)
                })
            }else{
                //结果的对象状态为成功，数据为result
                resolve(result)
            }
        }catch (error) {
            reject(error)
        } 
    }
    // 为了实现异常穿刺，当得到的返回值不是一个函数，创建一个默认值
    if(typeof onRejected !== 'function')
    // .then函数返回的也是一个promise对象
    return new Promise((resolve,reject) => {
         // 在修改状态是同步的前提下，应该在状态修改后调用回调函数
        // 也就是PromiseState已经被修改，且PromiseResult里面也有数据的时候
        // 这里由于是通过p.then来调用的，this总是指向调用这个方法的对象
        // 所以这里可以直接使用this
        if(this.PromiseState === "fullfilled"){
            try {
                let result = onResolved(self.PromiseResult);
                console.log("res",result)
                if(result instanceof Promise){
                    //如果返回的对象本来就是一个Promise对象
                    // 那就直接返回这个Promise对象
                    result.then(value => {
                        resolve(value)
                    },err =>{
                        reject(err)
                    })
                }else{
                    //结果的对象状态为成功，数据为result
                    resolve(result)
                }
            }catch (error) {
                reject(error)
            } 
        }
        

        if(this.PromiseState === "rejected"){
            try {
                let res = onRejected(this.PromiseResult);
                if(res instanceof Promise){
                    res.then(v =>{
                        resolve(v)
                    },err =>{
                        reject(err)
                    })
                }else{
                    resolve(res)
                }
            } catch (error) {
                reject(error)
            }
            
        }

        //由于存在异步，Promise对象可能一直没能修改状态
        // 所以也要判断pendding状态
        if(this.PromiseState === "pendding"){
            // 这样保存回调会有一个问题
            // 就是当有多个.then的时候，总是会存在后面的.then里面的回调函数
            // 覆盖之前的.then里面的回调函数
            // this.callback = {
            //     onResolved:onResolved,
            //     onRejected:onRejected
            // }
            // this.callbacks.push({
                // 当异步修改完promise状态后，会执行onRejected/Resolve函数
            //     onRejected:onRejected,
            //     onResolved:onResolved
            // })
            this.callbacks.push({
                onResolved: function (){
                    try {
                        let res = onResolved(self.PromiseResult)
                        if(res instanceof Promise){
                            res.then(value =>{
                                resolve(value)
                            },err =>{
                                reject(err)
                            })
                        }else{
                            resolve(res)
                        }
                    } catch (error) {
                        reject(error)
                    }
                    // 这里的this指向的是{onResolved:fn,onRejected:fn}这个对象的
                    
                },
                onRejected: function (){
                    try {
                        let res = onRejected(self.PromiseResult)
                        if(res instanceof Promise){
                            res.then(value =>{
                                resolve(value)
                            },err =>{
                                reject(err)
                            })
                        }else{
                            resolve(res)
                        }
                    } catch (error) {
                        reject(error)
                    }
                    
                }
            })

        }
    })
   
}
Promise.prototype.catch = function(onRejected){
    return this.then(undefined,onRejected)
}

Promise.prototype.race = function(){}

Promise.prototype.all = function(){}