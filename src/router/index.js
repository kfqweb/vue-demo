import Vue from 'vue';
import Router from 'vue-router';
// 导入组件
import Login from '@/components/login/Login';
import Home from '@/components/home/Home';
import Users from '@/components/user/Users.vue';
import Rights from '@/components/roles/Rights';
import Roles from '@/components/roles/Roles';
import Category from '@/components/goods/Category';
import { Message } from 'element-ui';

Vue.use(Router);

const router = new Router({
  routes: [
    {
      name: 'login',
      path: '/login',
      component: Login
    },
    {
      name: 'home',
      path: '/',
      component: Home,
      // 子路由，将来子路由的切换 是在Home组件中完成的
      // 子路由使用之前，home组件已经创建完毕
      children: [
        // 用户列表
        {
          name: 'users',
          path: '/users',
          component: Users
        },
        {
          name: 'rights',
          path: '/rights',
          component: Rights
        },
        {
          name: 'roles',
          path: '/roles',
          component: Roles
        },
        {
          name: 'category',
          path: '/categories',
          component: Category
        }
      ]
    }
  ]
});

// 路由的前置守卫
router.beforeEach((to, from, next) => {
  // console.log(to, from);
  // 判断当前访问的路由是否是login，如果是login直接next
  if (to.name === 'login') {
    next();
  } else {
    // 判断有没有token
    const token = sessionStorage.getItem('token');
    if (!token) {
      // 跳转到登录页面
      router.push({ name: 'login' });
      // 提示
      Message.warning('请先登录');
      return;
    }
    next();
  }
});

export default router;
