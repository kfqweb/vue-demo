<template>
  <el-card class="box-card">
    <!-- 面包屑 -->
    <my-breadcrumb level1="权限管理" level2="角色列表"></my-breadcrumb>

    <el-row class="row-add">
      <el-col :span="24">
        <el-input v-model.number="searchValue" class="searchInput" clearable placeholder="请输入角色ID">
        <el-button @click="handleQueryList" slot="append" icon="el-icon-search"></el-button>
      </el-input>
        <el-button @click="addRolesDialogVisible = true" type="success">添加角色</el-button>
      </el-col>
    </el-row>

    <!-- 表格 -->
    <el-table
      v-loading="loading"
      :data="list"
      style="width: 100%">
      <!-- 展开列 -->
      <el-table-column type="expand">
        <template slot-scope="scope">
          <!-- 当前角色中的权限列表 -->
          <!-- scope.row 角色对象 ---- roleName, roleDesc, children -->
          <!-- 一级权限 item1 -->
          <el-row
            class="level1"
            v-for="item1 in scope.row.children"
            :key="item1.id">
            <el-col :span="4">
              <!-- 显示一级权限 -->
              <el-tag @close="hanldeClose(scope.row, item1.id)" closable>{{ item1.authName }}</el-tag>
              <i class="el-icon-arrow-right"></i>
            </el-col>
            <!-- 二级和三级权限 -->
            <el-col :span="20">
              <!-- 二级权限 -->
              <el-row
                v-for="item2 in item1.children"
                :key="item2.id">
                <el-col :span="4">
                  <!-- 显示二级权限 -->
                  <el-tag @close="hanldeClose(scope.row, item2.id)"  closable type="success">{{ item2.authName }}</el-tag>
                  <i class="el-icon-arrow-right"></i>
                </el-col>
                <el-col :span="20">
                  <!-- 三级权限 -->
                  <el-tag
                    @close="hanldeClose(scope.row, item3.id)"
                    class="level3"
                    closable
                    type="warning"
                    v-for="item3 in item2.children"
                    :key="item3.id">
                    {{ item3.authName }}
                  </el-tag>
                </el-col>
              </el-row>
            </el-col>
          </el-row>
          <!-- 没有权限的时候显示 -->
          <el-row v-if="scope.row.children.length === 0">
            <el-col :span="24">未分配权限</el-col>
          </el-row>
        </template>
      </el-table-column>
      <el-table-column
        type="index"
        width="50">
      </el-table-column>
      <el-table-column
        prop="roleName"
        label="角色名称"
        width="180">
      </el-table-column>
      <el-table-column
        prop="roleDesc"
        label="角色描述"
        width="180">
      </el-table-column>
      <el-table-column
        label="操作">
        <template slot-scope="scope">
          <el-button plain size="mini" type="primary" icon="el-icon-edit" @click="handleShowEditDialog(scope.row)"></el-button>
          <el-button plain size="mini" type="danger" icon="el-icon-delete" @click="handleDeleteRoles(scope.row.id)"></el-button>
          <el-button @click="handleShowRightsDialog(scope.row)" plain size="mini" type="success" icon="el-icon-check" ></el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分配权限的对话框 -->
    <el-dialog
      @open="handleOpenDialog"
      title="分配权限"
      :visible.sync="dialogVisible">
      <!-- 树形结构
        data: 提供树形数据
        props: 设置数据中显示的属性
        node-key - 给每一个节点一个表示 ，一般绑定id
        当要使用default-expanded-keys和default-checked-keys必须先设置node-key
        default-checked-keys 设置默认选中的节点
       -->
      <el-tree
        ref="tree"
        v-loading="loadingTree"
        :data="treeData"
        :props="defaultProps"
        node-key="id"
        :default-checked-keys="checkedList"
        show-checkbox
        default-expand-all>
      </el-tree>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleSetRights">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 添加角色的对话框 -->
    <el-dialog @closed="handleClosed" title="添加角色" :visible.sync="addRolesDialogVisible">
      <!-- 
        :rules="formRules" => 表单验证规则 配合 prop="username" 使用
        * 规则写法为以下写法
        username: [
          { required: true, message: '请输入用户名称', trigger: 'blur' },
          { min: 1, max: 6, message: '长度在 1 到 6 个字符', trigger: 'blur' }
        ],

       -->
      <el-form
        ref="myform"
        :rules="formRules"
        label-width="100px"
        :model="formData">
        <el-form-item label="角色名" prop="roleName">
            <el-input v-model="formData.roleName" auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="角色描述">
            <el-input v-model="formData.roleDesc" auto-complete="off"></el-input>
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="addRolesDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="handleAddroles">确 定</el-button>
        </div>
    </el-dialog>

    <!-- 编辑角色的对话框 -->
    <el-dialog @closed="handleClosed" title="编辑用户" :visible.sync="editRolesDialogVisible">
      <el-form
        ref="myform"
        :rules="formRules"
        label-width="100px"
        :model="formData">
        <el-form-item label="角色名称" prop="roleName">
          <el-input disabled v-model="formData.roleName" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="角色描述">
          <el-input v-model="formData.roleDesc" auto-complete="off"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="editRolesDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleEditRoles">确 定</el-button>
      </div>
    </el-dialog>
  </el-card>
</template>

<script>
export default {
  data() {
    return {
      list: [],
      loading: true,
      loadingTree: true,
      // 添加角色弹窗框数据存储
      formData: {
        roleName: "",
        roleDesc: ""
      },
      // 表单验证规则
      formRules: {
        roleName: [
          { required: true, message: "请输入角色名称", trigger: "blur" },
          {
            min: 2,
            max: 100,
            message: "长度至少需要 2 个字符",
            trigger: "blur"
          }
        ],
        roleDesc: [
          { required: true, message: "请输入角色描述", trigger: "blur" },
          {
            min: 8,
            max: 100,
            message: "长度至少需要 8 个字符，最多不超过100个字符",
            trigger: "blur"
          }
        ]
      },
      // 
      searchValue:'',
      // 控制分配权限的对话框显示或隐藏
      dialogVisible: false,
      // 绑定tree所用的数据
      treeData: [],
      //
      addRolesDialogVisible: false,
      // 配置要展示数据中的哪个属性
      defaultProps: {
        children: "children",
        label: "authName"
      },
      // 获取要选择的节点的id
      checkedList: [],
      // 记录当前修改的角色id
      currentRoleId: -1,
      // 修改角色的对话框显示
      editRolesDialogVisible: false
    };
  },
  created() {
    this.loadData();
  },
  methods: {
    // 加载角色列表
    async loadData() {
      this.loading = true;
      // 获取响应对象 response  { data: {...}, status: }
      // const res = await this.$http.get('roles');
      // resData 是服务器返回的数据
      const { data: resData } = await this.$http.get("roles");
      this.loading = false;
      // data, status, msg
      const { data, meta: { status, msg } } = resData;
      if (status === 200) {
        this.list = data;
      } else {
        this.$message.error(msg);
      }
    },
    // 标签的关闭事件
    async hanldeClose(role, rightId) {
      // role 角色对象  rightId 权限id
      const { data: resData } = await this.$http.delete(
        `roles/${role.id}/rights/${rightId}`
      );
      const { data, meta: { status, msg } } = resData;
      if (status === 200) {
        // 成功
        this.$message.success(msg);
        // 重新绑定当前角色的children 权限
        role.children = data;
      } else {
        // 失败
        this.$message.error(msg);
      }
    },
    // 打开对话框的时候执行
    async handleOpenDialog() {
      this.loadingTree = true;
      const { data: resData } = await this.$http.get("rights/tree");
      this.loadingTree = false;
      const { data } = resData;
      this.treeData = data;
    },
    // 点击按钮，显示分配权限的对话框
    handleShowRightsDialog(role) {
      // 记录角色id， 分配权限的时候使用
      this.currentRoleId = role.id;
      this.dialogVisible = true;
      // 获取当前角色所拥有的权限的id
      // 遍历一级权限
      const arr = [];
      role.children.forEach(item1 => {
        // arr.push(item1.id);
        // 遍历二级权限
        item1.children.forEach(item2 => {
          // arr.push(item2.id);
          // 遍历三级权限
          item2.children.forEach(item3 => {
            arr.push(item3.id);
          });
        });
      });
      this.checkedList = arr;
    },
    // 点击确定按钮，分配权限
    async handleSetRights() {
      // 获取到被选中的节点的id
      const checkedKeys = this.$refs.tree.getCheckedKeys();
      // 获取到半选的节点的id
      const halfCheckedKeys = this.$refs.tree.getHalfCheckedKeys();
      const newArray = [...checkedKeys, ...halfCheckedKeys];
      const { data: resData } = await this.$http.post(
        `roles/${this.currentRoleId}/rights`,
        {
          rids: newArray.join(",")
        }
      );
      const { meta: { status, msg } } = resData;
      if (status === 200) {
        // 成功
        // 关闭对话框
        this.dialogVisible = false;
        // 提示
        this.$message.success(msg);
        // 重新加载数据
        this.loadData();
      } else {
        this.$message.error(msg);
      }
    },
    // 点击添加角色的弹出框的取消按钮
    handleClosed() {
      // 清空文本框
      for (let key in this.formData) {
        this.formData[key] = "";
      }
    },
    // 点击确定添加角色
    async handleAddroles() {
      // this.$refs.myform.validate
      // 对整个表单进行校验的方法，参数为一个回调函数。该回调函数会在校验结束后被调用，并传入两个参数：是否校验成功和未通过校验的字段。若不传入回调函数，则会返回一个 promise
      this.$refs.myform.validate(async valid => {
        if (!valid) {
          return this.$message.error("请完整输入内容");
        }
        //表单验证成功后 执行请求
        const res = await this.$http.post('roles',this.formData);
        // 相当于回调函数中的处理
        const data = res.data;
        const { meta: { status, msg } } = data;
        if (status === 201) {
          // 添加成功
          // 隐藏对话框
          this.addRolesDialogVisible = false;
          // 提示成功
          this.$message.success(msg);
          // 重新加载数据
          this.loadData();
          // 清空文本框的值
          for (let key in this.formData) {
            this.formData[key] = '';
          }
        } else {
          this.$message.error(msg);
        }
      });
    },
    // 搜索数据
    async handleQueryList() {
      console.log(this.searchValue)
      if(!this.searchValue){
        this.loadData();
        return;
      }
      // 获取带参数的数据
      const { data: resData }  = await this.$http.get(`roles/${this.searchValue}`);
      console.log(resData );
      const { data, meta: { status, msg } } = resData;
      this.list = [data]  
    },
    // 删除用户数据
    async handleDeleteRoles(id) {
      this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        // 包裹 await 的函数都需要加上async
        // 点击确定按钮执行
        const res = await this.$http.delete(`roles/${id}`);
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
    // 编辑角色
    handleShowEditDialog(role) {
      console.log(role)
      // 显示对话框
      this.editRolesDialogVisible = true;
      // 给dataformData赋值
      this.formData.roleName = role.roleName;
      this.formData.roleDesc = role.roleDesc;
      this.formData.id = role.id;
    },
    //  点击确认按钮后触发 的事件
    async handleEditRoles() {
      // 发送请求 roles/:id
      const res = await this.$http.put(`roles/${this.formData.id}`,{
        roleName : this.formData.roleName,
        roleDesc : this.formData.roleDesc
      })
      // 处理数据
      console.log(res)
      const data = res.data;
      const { meta: { status, msg } } = data;
      // 页面刷新
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
    }
  }
};
</script>

<style>
.row-add {
  margin-top: 10px;
  margin-bottom: 10px;
}
.level3 {
  margin-right: 5px;
  margin-bottom: 5px;
}
.level1 {
  margin-bottom: 10px;
}
.searchInput {
  width: 350px;
}
</style>