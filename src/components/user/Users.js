export default {
  data() {
    return {
      // 用户列表数据
      list: [],
      // true显示正在加载，false的时候不显示
      loading: true,
      // 分页相关数据
      // 页码
      pagenum: 1,
      // 每页条数
      pagesize: 4,
      // 总共的数据条数，从服务器获取
      total: 0,
      // 绑定搜索文本框
      searchValue: '',
      // 控制添加用户的对话框显示或者隐藏
      addUserDialogVisible: false,
      // 绑定表单数据
      formData: {
        username: '',
        password: '',
        email: '',
        mobile: ''
      },
      // 表单的验证规则
      formRules: {
        username: [
          { required: true, message: '请输入用户名称', trigger: 'blur' },
          { min: 1, max: 6, message: '长度在 1 到 6 个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 3, max: 6, message: '长度在 3 到 6 个字符', trigger: 'blur' }
        ]
      },
      // 控制编辑用户的对话框显示或者隐藏
      editUserDialogVisible: false,
      // 控制分配角色对话框的显示或者隐藏
      setRoleDialogVisible: false,
      // 分配角色需要的数据
      currentUserName: '',
      currentUserId: -1,
      currentRoleId: -1,
      roles: []
    };
  },
  created() {
    // 发送请求获取数据
    this.loadData();
  },
  methods: {
    // 分页事件
    handleSizeChange(val) {
      // 每页条数改变的时候
      this.pagesize = val;
      this.loadData();
      console.log(`每页 ${val} 条`);
    },
    handleCurrentChange(val) {
      // 页码改变的时候
      this.pagenum = val;
      this.loadData();
      console.log(`当前页: ${val}`);
    },
    // 发送异步请求，获取数据
    async loadData() {
      // 发送异步请求之前
      this.loading = true;

      // // 发送请求之前，获取token
      // const token = sessionStorage.getItem('token');
      // // 在请求头中设置token
      // this.$http.defaults.headers.common['Authorization'] = token;

      const res = await this.$http.get(`users?pagenum=${this.pagenum}&pagesize=${this.pagesize}&query=${this.searchValue}`);

      // 异步请求结束
      this.loading = false;

      // 获取响应数据
      const data = res.data;
      // meta中的msg 和 status
      const { meta: { msg, status } } = data;
      if (status === 200) {
        const { data: { users, total } } = data;
        this.list = users;
        // 获取总共多少条数据
        this.total = total;
      } else {
        this.$message.error(msg);
      }
    },
    // 搜索按钮
    handleSearch() {
      // 带上查询参数
      this.loadData();
    },
    // 当开关的状态发生改变
    async handleSwitchChange(user) {
      // console.log(user);
      const res = await this.$http.put(`users/${user.id}/state/${user.mg_state}`);

      // 响应对象 res = { data, status }
      // 服务器返回的数据格式 res.data  = { data: {}, meta: {} }
      const data = res.data;
      const { meta: { status, msg } } = data;
      if (status === 200) {
        this.$message.success(msg);
      } else {
        this.$message.error(msg);
      }
    },
    // 删除
    // 1. 给删除按钮，注册事件
    // 2. 提示是否删除
    // 3. 发送请求
    async handleDelete(id) {
      this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        // 包裹 await 的函数都需要加上async
        // 点击确定按钮执行
        const res = await this.$http.delete(`users/${id}`);

        // 服务器返回的数据
        const data = res.data;
        // meta内部的status和msg
        const { meta: { status, msg } } = data;
        if (status === 200) {
          // 删除成功 重新加载数据
          this.pagenum = 1;
          this.loadData();

          this.$message({
            type: 'success',
            message: msg
          });
        } else {
          this.$message.error(msg);
        }
      }).catch(() => {
        // 点击取消按钮执行
        this.$message({
          type: 'info',
          message: '已取消删除'
        });
      });
    },
    // 添加用户的对话框中的确定按钮，要执行添加用户的操作
    async handleAdd() {
      // 表单的 DOM对象 this.$refs.myform
      this.$refs.myform.validate(async (valid) => {
        if (!valid) {
          return this.$message.error('请完整输入内容');
        }
        // 表单验证成功，添加的操作
        const res = await this.$http.post('users', this.formData);

        // 相当于回调函数中的处理
        const data = res.data;
        const { meta: { status, msg } } = data;
        if (status === 201) {
          // 添加成功
          // 隐藏对话框
          this.addUserDialogVisible = false;
          // 提示成功
          this.$message.success(msg);
          // 重新加载数据
          this.loadData();
          // 清空文本框的值
          // for (let key in this.formData) {
          //   this.formData[key] = '';
          // }
        } else {
          this.$message.error(msg);
        }
      });
    },
    // 点击编辑按钮，弹出编辑的对话框
    handleShowEditDialog(user) {
      // 显示对话框
      this.editUserDialogVisible = true;
      // 文本框显示用户信息
      this.formData.username = user.username;
      this.formData.email = user.email;
      this.formData.mobile = user.mobile;
      this.formData.id = user.id;
    },
    // 点击确定按钮，实现修改用户
    async handleEdit() {
      // console.log(this.formData);
      const res = await this.$http.put(`users/${this.formData.id}`, {
        mobile: this.formData.mobile,
        email: this.formData.email
      });
      // 解析数据
      const data = res.data;
      const { meta: { status, msg } } = data;
      // 判断
      if (status === 200) {
        // 修改成功
        // 提示成功
        this.$message.success(msg);
        // 关闭对话框
        this.editUserDialogVisible = false;
        // 重新加载列表
        this.loadData();
        // // 清空文本框
        // for (let key in this.formData) {
        //   this.formData[key] = '';
        // }
      } else {
        this.$message.error(msg);
      }
    },
    // 添加和修改的对话框关闭以后执行
    handleClosed() {
      // 清空文本框
      for (let key in this.formData) {
        this.formData[key] = '';
      }
    },
    // 点击分配权限按钮，打开分配权限的对话框
    async handleShowSetRoleDialog(user) {
      // 记录当前用户的id
      this.currentUserId = user.id;
      // user用户对象
      // console.log(user);
      this.currentUserName = user.username;
      // 显示对话框
      this.setRoleDialogVisible = true;
      // 获取所有的角色
      const res = await this.$http.get('roles');
      this.roles = res.data.data;

      // 根据用户id查询用户对象，角色id
      const res1 = await this.$http.get(`users/${user.id}`);
      this.currentRoleId = res1.data.data.rid;
    },
    // 分配角色
    async handleSetRole() {
      const res = await this.$http.put(`users/${this.currentUserId}/role`, {
        rid: this.currentRoleId
      });

      const data = res.data;
      const { meta: { status, msg } } = data;
      if (status === 200) {
        // 成功
        // 关闭对话框
        this.setRoleDialogVisible = false;
        // 提示
        this.$message.success(msg);
        // 重置数据
        this.currentUserName = '';
        this.currentUserId = -1;
        this.currentRoleId = -1;
      } else {
        // 失败
        this.$message.error(msg);
      }
    }
  }
};