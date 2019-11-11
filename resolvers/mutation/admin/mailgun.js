const mailgun = {
    sendMailgunEmail: async (root, args, context) => {
        if (!process.env['MAILGUN_API_KEY']) {
            console.log('Please provide a valid mailgun secret key!');
            return { error: 'Module not configured correctly.' };
        }

        if (!process.env['MAILGUN_DOMAIN']) {
            console.log('Please provide a valid mailgun domain!');
            return { error: 'Module not configured correctly.' };
        }
        try {
            const token = new Buffer.from(
                `api:${process.env['MAILGUN_API_KEY']}`
            ).toString('base64');
            const endpoint = `https://api.eu.mailgun.net/v3/${
                process.env['MAILGUN_DOMAIN']
            }/messages`;

            const { tag, to, subject, text } = args;
            const f = args.from;
            const recipientVariables = args.recipientVariables || {};

            if (to.length > 1000) {
                return { error: `Can't batch more than 1000 emails!` };
            }

            const form = new FormData();
            form.append('from', 'miss.lana.sedlmayr@gmail.com');

            console.log('to is: ', to);

            for (var i = 0; i < to.length; i++) {
                form.append('to', to[i]);
            }

            form.append('subject', subject);
            form.append('text', text);
            form.append(
                'recipient-variables',
                JSON.stringify(recipientVariables)
            );

            const data = await fetch(endpoint, {
                headers: {
                    Authorization: `Basic ${token}`,
                },
                method: 'POST',
                body: form,
            })
                .then(response => response.json())
                .catch(e => console.log('error is: ', e));

            console.log('data is: ', data);

            return { success: true };
        } catch (e) {
            console.log(`Email could not be sent because an error occured:`);
            console.log(e);
            return {
                error: 'An unexpected error occured while sending email.',
                success: false,
            };
        }
    },
};

module.exports = mailgun;
