![Header](./banner.png)

<div align="center">

![Profile Views](https://komarev.com/ghpvc/?username=SAIKO0000&color=0891b2&style=flat-square&label=Profile+Views)

</div>

<h1 align="center">
  <img src="https://readme-typing-svg.herokuapp.com/?font=Righteous&size=35&center=true&vCenter=true&width=600&height=70&duration=4000&color=87CEEB&background=87CEEB00&gradient=4FC3F7,29B6F6,0288D1&gradientColor=true&lines=Hi+There!+👋;Building+the+Future+with+Code+🚀;Turning+Ideas+into+Reality+💡;Full-Stack+Developer+%26+Problem+Solver+⚡;" />
</h1>

<div align="center">
  
**🎓 Computer Science Student | 💻 Full-Stack Developer | 🚀 Building the Future**

*Passionate about creating scalable web applications and solving real-world problems through innovative technology*

</div>

---

## 🔥 Featured Project

<table>
<tr>
<td width="50%">

### 🚀 **ProjTrack - Engineering Management System**
A comprehensive full-stack project management platform designed to streamline engineering workflows and enhance team collaboration.

**🌐 [🔗 Live Demo](https://gyg-project-management.vercel.app/)** | **[📁 Repository](https://github.com/SAIKO0000/Management_GYG)**

**🛠️ Built With:**
- Next.js 15 + TypeScript + React 19
- Supabase (PostgreSQL) + TanStack Query  
- TailwindCSS + Radix UI + Framer Motion
- PDF Export + Real-time Updates

**⚡ Key Achievements:**
- 📊 **40-50% reduction** in API calls through query optimization
- 🏗️ **Modular architecture** with reusable components
- 📱 **Mobile-responsive** design for field operations
- 🔄 **Real-time collaboration** with WebSocket integration

</td>
<td width="50%">

```javascript
// Performance Optimization Example
const optimizedQuery = useQuery({
  queryKey: ['tasks'],
  queryFn: async () => {
    return supabase
      .from('tasks')
      .select(`
        *,
        project:projects(id, name),
        assignee:personnel(id, name)
      `)
      .order('created_at', { ascending: false })
  },
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 15 * 60 * 1000,   // 15 minutes
})
```

</td>
</tr>
</table>

---

## 🛠️ Tech Stack & Tools

<div align="center">

### 💻 Programming Languages
![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

### 🚀 Frameworks & Libraries
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![WordPress](https://img.shields.io/badge/WordPress-21759B?style=for-the-badge&logo=wordpress&logoColor=white)

### 🗄️ Databases & Backend
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

### ☁️ Cloud & Deployment
![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

### 🔧 Development Tools & IDEs
![VS Code](https://img.shields.io/badge/VS_Code-0078D4?style=for-the-badge&logo=visual%20studio%20code&logoColor=white)
![Visual Studio](https://img.shields.io/badge/Visual_Studio-5C2D91?style=for-the-badge&logo=visual%20studio&logoColor=white)
![PyCharm](https://img.shields.io/badge/PyCharm-143?style=for-the-badge&logo=pycharm&logoColor=black&color=black&labelColor=green)
![IntelliJ IDEA](https://img.shields.io/badge/IntelliJ_IDEA-000000.svg?style=for-the-badge&logo=intellij-idea&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![Figma](https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white)

### 🎮 Game Development & Creative Tools
![Unity](https://img.shields.io/badge/Unity-100000?style=for-the-badge&logo=unity&logoColor=white)
![Godot](https://img.shields.io/badge/GODOT-%23FFFFFF.svg?style=for-the-badge&logo=godot-engine)
![Blender](https://img.shields.io/badge/blender-%23F5792A.svg?style=for-the-badge&logo=blender&logoColor=white)

### 💻 Operating Systems
![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)

</div>

---

## 📊 GitHub Analytics

<div align="center">
  <img width="49%" height="195px" src="https://github-readme-stats.vercel.app/api?username=SAIKO0000&show_icons=true&count_private=true&hide_border=true&title_color=00b4d8&icon_color=00b4d8&text_color=c9d1d9&bg_color=0d1117" alt="Mark Daniel Iguban github stats" /> 
  <img width="41%" height="195px" src="https://github-readme-stats.vercel.app/api/top-langs/?username=SAIKO0000&layout=compact&hide_border=true&title_color=00b4d8&text_color=00b4d8&bg_color=0d1117" />
</div>

<div align="center">
  <img src="https://github-readme-streak-stats.herokuapp.com?user=SAIKO0000&theme=gotham&hide_border=true&background=0D1117&stroke=0000&ring=00b4d8&fire=00b4d8&currStreakLabel=00b4d8" alt="GitHub Streak" />
</div>

---

## 🎯 Current Learning Path

<table>
<tr>
<td width="50%">

### 🔥 **Now Focusing On:**
- 🚀 **Advanced React Patterns** - Compound components, render props
- ⚡ **Performance Optimization** - Code splitting, lazy loading
- 🛠️ **System Design** - Microservices architecture
- 🤖 **AI Integration** - Machine learning for project insights

</td>
<td width="50%">

### 📚 **Learning Queue:**
- ☁️ **Cloud Architecture** - AWS, containerization
- 📱 **Mobile Development** - React Native, PWAs  
- 🔐 **DevOps & Security** - CI/CD, authentication
- 📊 **Data Analytics** - Data visualization, insights

</td>
</tr>
</table>

---

## 🏆 Achievements & Highlights

<div align="center">

| 🎯 **Project Metrics** | 📈 **Technical Growth** |
|:---:|:---:|
| ⚡ **40-50%** API optimization | 🔧 **TypeScript** expertise |
| 📊 **Real-time** data sync | 🎨 **Modern UI/UX** design |
| 📱 **Mobile-first** approach | 🚀 **Performance** optimization |
| 🏗️ **Scalable** architecture | 📚 **Continuous** learning |

</div>

---

## 🌐 Connect & Collaborate

<div align="center">

[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/sircartierr0/)
[![Facebook](https://img.shields.io/badge/Facebook-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](https://www.facebook.com/MarkDaniel.Iguban)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:main.markdaniel.iguban@cvsu.edu.ph)

</div>

---

## 💭 Developer Philosophy

<div align="center">

*"Code is not just about solving problems—it's about crafting elegant solutions that make a meaningful impact on people's lives."*

**🎮 Fun Fact:** When I'm not coding, you'll find me reading manga/manhwa or exploring the latest web development frameworks! 📚✨

</div>

---

<div align="center">
  
![Bottom](https://capsule-render.vercel.app/api?type=waving&color=gradient&height=100&section=footer)

**Thanks for visiting! 🚀 Let's build something amazing together!**

</div>
