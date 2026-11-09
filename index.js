import 'dotenv/config';
import { Client, GatewayIntentBits, ChannelType, EmbedBuilder } from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', () => {
    console.log(`✅ Clipping Bot online! Standby di channel 🤖command`);
});

client.on('messageCreate', async (message) => {
    // Abaikan pesan dari sesama bot
    if (message.author.bot) return;

    // ==========================================
    // 1. COMMAND: !help
    // ==========================================
    if (message.content.trim() === '!help') {
        const helpEmbed = new EmbedBuilder()
            .setColor('#6366f1') // Warna Indigo/Biru Keunguan
            .setTitle('🤖 Pusat Bantuan Clipping Bot')
            .setDescription('Berikut adalah daftar command yang dapat digunakan pada server ini:')
            .addFields(
                { 
                    name: '🛠️ `!create <Region> <Nama Campaign>`', 
                    value: 'Membuat kategori dan set channel (workspace) baru beserta template pesan otomatis.\n**Region didukung:** `US` atau `ID`\n**Contoh:** `!create US Kai Cenat`\n*(Syarat: Hanya role **Owner** dan wajib di channel 🤖command)*' 
                },
                { 
                    name: 'ℹ️ `!help`', 
                    value: 'Menampilkan daftar panduan command ini.' 
                }
            )
            .setFooter({ text: 'Clipping Bot Auto-Generator', iconURL: client.user.displayAvatarURL() });

        return message.reply({ embeds: [helpEmbed] });
    }

    // ==========================================
    // 2. COMMAND: !create
    // ==========================================
    if (message.content.startsWith('!create ')) {
        
        // Filter Lokasi Command
        const currentChannel = message.channel;
        const currentCategory = currentChannel.parent;

        const isCorrectCategory = currentCategory && currentCategory.name.includes('General');
        const isCorrectChannel = currentChannel.name.includes('command');

        if (!isCorrectCategory || !isCorrectChannel) {
            return; // Diam jika bukan di channel yang tepat
        }

        // Filter Role ("Owner")
        const isOwner = message.member.roles.cache.some(role => role.name.toLowerCase() === 'owner');
        if (!isOwner) {
            return message.reply("⛔ Akses ditolak. Hanya **Owner** yang dapat men-generate campaign baru.");
        }

        // Parsing Argumen
        const args = message.content.split(' ').slice(1);
        if (args.length < 2) {
            return message.reply("⚠️ Format salah! Ketik `!help` untuk melihat cara penggunaan.");
        }

        const region = args[0].toUpperCase();
        const campaignName = args.slice(1).join(' ');

        if (region !== 'US' && region !== 'ID') {
            return message.reply("⚠️ Region yang didukung hanya **US** atau **ID**. Ketik `!help` untuk info lebih lanjut.");
        }

        const categoryName = `📷 ${region} - ${campaignName}`;
        const embedColor = region === 'US' ? '#3b82f6' : '#ef4444';

        try {
            const replyMsg = await message.channel.send(`⏳ Menyiapkan workspace untuk **${campaignName}**...`);

            await message.guild.channels.fetch(); 

            // Logika Sorting Kategori
            const existingCategories = message.guild.channels.cache.filter(c => 
                c.type === ChannelType.GuildCategory && c.name.startsWith(`📷 ${region} -`)
            );

            let targetPosition = undefined;
            if (existingCategories.size > 0) {
                const sortedCats = existingCategories.sort((a, b) => a.position - b.position);
                const lastCategoryOfSameRegion = sortedCats.last();
                targetPosition = lastCategoryOfSameRegion.position + 1;
            }

            // Eksekusi Pembuatan Kategori
            const category = await message.guild.channels.create({
                name: categoryName,
                type: ChannelType.GuildCategory,
                position: targetPosition 
            });

            // Definisi Template Channels & Pesan Embed Pembuka
            const channelsData = [
                { 
                    name: '🌐-general', 
                    topic: 'Informasi General: Link campaign, Akun yang digunakan, platform (Whop, Vyro, dll).',
                    embed: new EmbedBuilder()
                        .setColor(embedColor)
                        .setTitle(`📌 Campaign Overview: ${campaignName}`)
                        .setDescription(`Informasi utama terkait operasional campaign ini.\n\n**🔹 Detail Campaign**\n> **Platform:** [Isi Platform]\n> **Status:** 🟢 Active\n> **PIC:** [@Nama]\n\n**🔹 Akun Sosmed**\n> **TikTok:** [Link]\n> **YT Shorts:** [Link]\n> **IG Reels:** [Link]`)
                        .setFooter({ text: 'Pastikan keamanan login akun terjaga.' })
                },
                { 
                    name: '📋-brief', 
                    topic: 'Overall brief campaign, rules, hashtag, dan link folder GDrive sumber video.',
                    embed: new EmbedBuilder()
                        .setColor(embedColor)
                        .setTitle(`📑 Brief & Guidelines: ${campaignName}`)
                        .setDescription(`**📂 Sumber Aset Utama:**\n> [Taruh Link GDrive/Folder Disini]\n\n**📝 Copywriting & Tags**\n> **Tag:** [@TargetAkun]\n> **Hashtags:** \`#tag1 #tag2\`\n> **Link:** [Link Produk/Tujuan]\n\n**⚠️ Rules (Wajib Dibaca)**\n> 1. Dilarang keras overclaim.\n> 2. Durasi video minimal 15s.\n> 3. Edit natural, hindari full AI.`)
                },
                { 
                    name: '📁-raw-assets', 
                    topic: 'Tempat drop aset mentahan atau link video sumber spesifik per hari.',
                    embed: new EmbedBuilder()
                        .setColor(embedColor)
                        .setTitle(`📥 Raw Assets Drop`)
                        .setDescription(`Drop bahan mentahan di sini. Jika file > 25MB, gunakan link GDrive.\n\n**Gunakan Format Ini:**\n\`\`\`Tanggal    : \nLink Video : \nKeterangan : (Misal: Menit 1:20 tolong di-clip)\`\`\``)
                },
                { 
                    name: '🔗-submitted-content', 
                    topic: 'Drop semua link video TikTok/Shorts/Reels yang sudah di-publish.',
                    embed: new EmbedBuilder()
                        .setColor('#10b981')
                        .setTitle(`📤 Publication Log`)
                        .setDescription(`Drop link video yang sudah ter-publish di bawah ini agar rapi dalam 1 page.\n\n**Format Laporan:**\n\`\`\`📱 Platform : \n🔗 Link Post: \n🕒 Jam      :\`\`\``)
                },
                { 
                    name: '💰-approved-monet', 
                    topic: 'List konten yang sudah di-approve monetisasi / menghasilkan komisi.',
                    embed: new EmbedBuilder()
                        .setColor('#f59e0b')
                        .setTitle(`🏆 Approval & Monetization`)
                        .setDescription(`Khusus untuk mengonfirmasi status konten (Approve/Reject) atau yang sudah tembus syarat monet.\n\n**Format Konfirmasi:**\n\`\`\`🔗 Link Video : \n📊 Status     : [Approve / Reject / FYP]\n📸 Keterangan : (Upload screenshot jika perlu)\`\`\``)
                }
            ];

            // Loop Pembuatan Channel, Kirim Embed, dan Pin Pesan
            for (const chData of channelsData) {
                const newChannel = await message.guild.channels.create({
                    name: chData.name,
                    type: ChannelType.GuildText,
                    parent: category.id,
                    topic: chData.topic 
                });

                const sentMessage = await newChannel.send({ embeds: [chData.embed] });
                await sentMessage.pin();
                
                const messages = await newChannel.messages.fetch({ limit: 5 });
                const pinSystemMsg = messages.find(m => m.type === 6);
                if (pinSystemMsg) {
                    await pinSystemMsg.delete().catch(() => {});
                }
            }

            await replyMsg.edit(`✅ Workspace **${categoryName}** siap digunakan secara penuh!`);
            
        } catch (error) {
            console.error(error);
            message.reply("❌ Terjadi kesalahan sistem. Pastikan bot memiliki permission 'Manage Channels' dan 'Manage Messages'.");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);