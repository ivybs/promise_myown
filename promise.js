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
    // 为了实现异常穿刺，当得到的返回值不是一个函数，创建一个默认值
    
    if(typeof onRejected !== 'function'){
        // 相当于 如果你没有传onRejected回调函数的时候
        // 就会默认给你返回下面这样的一个函数
        onRejected = reason => {
            throw reason
        }
    }

    // 为了实现即使.then里面两个回调函数都为空也可以继续使用下面的调用链
    // 为onResolved函数设置默认的函数
    if(typeof onResolved !== 'function'){
        onResolved = value => value
        // onResolved = value => {return value;}
    }
    // .then函数返回的也是一个promise对象
    return new Promise((resolve,reject) => {
         // 在修改状态是同步的前提下，应该在状态修改后调用回调函数
        // 也就是PromiseState已经被修改，且PromiseResult里面也有数据的时候
        // 这里由于是通过p.then来调用的，this总是指向调用这个方法的对象
        // 所以这里可以直接使用this
        if(this.PromiseState === "fullfilled"){
            try {
                let result = onResolved(self.PromiseResult);
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

// Promise.prototype.then
// 后面的函数是属于Promise函数的实例对象的
// Promise.then
// 后面的函数是属于Promise函数对象的
Promise.resolve = function(value){
    return new Promise((resolve,reject) => {
        if(value instanceof Promise){
            value.then(v => {
                resolve(v)
            },e => {
                reject(e)
            })
        }else{
            resolve(value)
        }
    })
}

Promise.reject = function(value){
    return new Promise((resolve,reject) => {
        reject(value)
    })
}

// all方法标志数组中的所有Promise状态都是fullfill的时候,
// all返回的promise对象的状态才是fullfill,且返回的数据是所有对象的数据的集合
// 在所有的Promise对象中只要有一个promise对象返回的是reject,那么all返回的就是reject
// 并且all返回的promise对象的数据是reject的这个对象的数据
Promise.all = function(promises){
    return new Promise((resolve,reject)=>{
        let count = 0;
        let arr = [];
        promises.forEach((item,i) => {
            item.then(v => {
                // 计数
                count ++
                // 将当前promise对象成功的结果 存入到数组中
                // 用push存在一个小瑕疵,因为可能存在p3比p1先执行.push这个函数
                // arr.push(v)
                arr[i] = v      
                // 只有当所有的Promise对象都成功了
                if(count === promises.length){
                    resolve(arr)
                }
            }, err => {
                reject(err)
            })
           
       })
    })


}






Promise.race = function(promises){
    return new Promise((resolve,reject) => {
        for(let i =0; i< promises.length;i++){
            promises[i].then(v => {
                // 修改状态为fullfill
                resolve(v)
            }, e => {
                // 修改状态为reject
                // 注意一个问题就是,状态修改过一次后不能再修改
                // 所以代码不需要再做过多的处理了
                reject(e)
            })
        }
    })


}

