# 1. Base Image: Node.js ka lightweight version (Alpine) use kar rahe hain security ke liye
FROM node:18-alpine

# 2. Working Directory: Container ke andar ek folder banao
WORKDIR /usr/src/app

# 3. Dependencies Copy: Pehle sirf package files copy karo
COPY package*.json ./

# 4. Install: Sirf production libraries install karo (security audit ke baad)
RUN npm install --only=production

# 5. App Source: Baqi saara code copy karo
COPY . .

# 6. Port: Jo port tumhara app use kar raha hai (usually 3000)
EXPOSE 3000

# 7. Start: App ko chalane ki command
CMD ["node", "app.js"]